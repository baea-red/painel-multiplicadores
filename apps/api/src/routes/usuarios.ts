import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { CriarUsuarioSchema } from '@gmb/schema'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePerfil } from '../middleware/auth.js'
import { hash, validate as validateSenha } from '../lib/password.js'
import { conflict, badRequest, notFound } from '../lib/errors.js'

const usuarios = new Hono()

usuarios.use('*', requireAuth)

const RedefinirSenhaSchema = z.object({
  novaSenha: z.string().min(8, 'Mínimo 8 caracteres'),
})

// GET /usuarios — GAP 10: paginação adicionada
usuarios.get('/', requirePerfil('administrador'), async (c) => {
  const page = Number(c.req.query('page') ?? '1')
  const limit = Math.min(Number(c.req.query('limit') ?? '20'), 100)
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      omit: { senhaHash: true },
      include: { multiplicadora: true, coordenador: true },
      orderBy: { nome: 'asc' },
      skip,
      take: limit,
    }),
    prisma.user.count(),
  ])
  return c.json({ usuarios: users, total, page, limit, pages: Math.ceil(total / limit) })
})

// POST /usuarios
usuarios.post('/', requirePerfil('administrador'), zValidator('json', CriarUsuarioSchema), async (c) => {
  const data = c.req.valid('json')

  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
  if (exists) return conflict(c, 'E-mail já cadastrado no sistema')

  const senhaErro = validateSenha(data.senhaProvisoria)
  if (senhaErro) return badRequest(c, senhaErro)

  const senhaHash = await hash(data.senhaProvisoria)

  const user = await prisma.user.create({
    data: {
      nome: data.nome,
      email: data.email.toLowerCase(),
      senhaHash,
      perfil: data.perfil,
      telefone: data.telefone,
      estado: data.estado,
      municipio: data.municipio,
      bairro: data.bairro,
      regiao: data.regiao,
      estados: data.estados ?? [],
      ...(data.perfil === 'multiplicadora' && {
        multiplicadora: { create: { dataIngresso: new Date() } },
      }),
      ...(data.perfil === 'coordenador' && {
        coordenador: { create: { regiao: data.regiao ?? '' } },
      }),
    },
    omit: { senhaHash: true },
    include: { multiplicadora: true, coordenador: true },
  })

  return c.json({ usuario: user }, 201)
})

// POST /usuarios/:id/redefinir-senha — GAP 3/6: Zod + permissão limpa
// Admin pode redefinir qualquer senha; coordenador só de multiplicadoras do seu estado
usuarios.post('/:id/redefinir-senha', requirePerfil('coordenador', 'administrador'), zValidator('json', RedefinirSenhaSchema), async (c) => {
  const caller = c.get('user')
  const id = c.req.param('id')
  const { novaSenha } = c.req.valid('json')

  const user = await prisma.user.findUnique({
    where: { id },
    include: { multiplicadora: true },
  })
  if (!user) return notFound(c)

  // Coordenador só pode redefinir senha de multiplicadoras do seu estado
  if (caller.perfil === 'coordenador') {
    if (user.perfil !== 'multiplicadora') return badRequest(c, 'Coordenador só pode redefinir senha de multiplicadoras')
    const coord = await prisma.coordenador.findUnique({ where: { id: caller.coordenadorId! } })
    const userCoord = await prisma.user.findUnique({ where: { id: coord!.userId } })
    const estados = userCoord?.estados ?? []
    if (!estados.includes(user.estado ?? '')) return badRequest(c, 'Multiplicadora fora do seu escopo de estado')
  }

  const erro = validateSenha(novaSenha)
  if (erro) return badRequest(c, erro)

  await prisma.user.update({ where: { id }, data: { senhaHash: await hash(novaSenha) } })
  return c.json({ ok: true })
})

// POST /usuarios/:id/ativar
usuarios.post('/:id/ativar', requirePerfil('administrador'), async (c) => {
  const id = c.req.param('id')
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return notFound(c)
  await prisma.user.update({ where: { id }, data: { ativo: true } })
  return c.json({ ok: true })
})

// POST /usuarios/:id/desativar
usuarios.post('/:id/desativar', requirePerfil('administrador'), async (c) => {
  const id = c.req.param('id')
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return notFound(c)
  await prisma.user.update({ where: { id }, data: { ativo: false } })
  return c.json({ ok: true })
})

export default usuarios
