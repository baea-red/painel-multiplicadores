import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CriarUsuarioSchema } from '@gmb/schema'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePerfil } from '../middleware/auth.js'
import { hash, validate as validateSenha } from '../lib/password.js'
import { conflict, badRequest, notFound } from '../lib/errors.js'

const usuarios = new Hono()

usuarios.use('*', requireAuth, requirePerfil('administrador'))

// GET /usuarios
usuarios.get('/', async (c) => {
  const users = await prisma.user.findMany({
    omit: { senhaHash: true },
    include: { multiplicadora: true, coordenador: true },
    orderBy: { nome: 'asc' },
  })
  return c.json({ usuarios: users })
})

// POST /usuarios
usuarios.post('/', zValidator('json', CriarUsuarioSchema), async (c) => {
  const data = c.req.valid('json')

  // Email uniqueness
  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
  if (exists) return conflict(c, 'E-mail já cadastrado no sistema')

  // Password validation
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
      // Create related profile record
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

// POST /usuarios/:id/redefinir-senha — coord ou admin
// (contorna o requirePerfil('administrador') do use('*') verificando manualmente)
usuarios.post('/:id/redefinir-senha', async (c) => {
  const caller = c.get('user')
  if (!['coordenador', 'administrador'].includes(caller.perfil)) {
    return c.json({ error: 'Sem permissão' }, 403)
  }
  const id = c.req.param('id')
  const { novaSenha } = await c.req.json() as { novaSenha: string }
  if (!novaSenha) return badRequest(c, 'Nova senha obrigatória')
  const erro = validateSenha(novaSenha)
  if (erro) return badRequest(c, erro)
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return notFound(c)
  await prisma.user.update({ where: { id }, data: { senhaHash: await hash(novaSenha) } })
  return c.json({ ok: true })
})

// POST /usuarios/:id/ativar
usuarios.post('/:id/ativar', async (c) => {
  const id = c.req.param('id')
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return notFound(c)
  await prisma.user.update({ where: { id }, data: { ativo: true } })
  return c.json({ ok: true })
})

// POST /usuarios/:id/desativar
usuarios.post('/:id/desativar', async (c) => {
  const id = c.req.param('id')
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return notFound(c)
  await prisma.user.update({ where: { id }, data: { ativo: false } })
  return c.json({ ok: true })
})

export default usuarios
