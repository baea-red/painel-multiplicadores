import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePerfil } from '../middleware/auth.js'
import { notFound, forbidden, badRequest } from '../lib/errors.js'

const multiplicadores = new Hono()

multiplicadores.use('*', requireAuth)

const AtualizarMultiplicadoraSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
})

// GET /multiplicadoras
multiplicadores.get('/', async (c) => {
  const user = c.get('user')
  const page = Math.max(1, Number(c.req.query('page') ?? '1'))
  const limit = Math.min(Math.max(1, Number(c.req.query('limit') ?? '20')), 100)
  const skip = (page - 1) * limit

  if (user.perfil === 'multiplicadora') {
    const mult = await prisma.multiplicador.findUnique({
      where: { id: user.multiplicadoraId },
      include: { user: { omit: { senhaHash: true } }, rodas: true },
    })
    if (!mult) return notFound(c, 'Perfil não encontrado')
    return c.json({ multiplicadoras: [mult], total: 1, page: 1, limit, pages: 1 })
  }

  if (user.perfil === 'coordenador') {
    const coord = await prisma.coordenador.findUnique({ where: { id: user.coordenadorId } })
    if (!coord) return notFound(c, 'Coordenador não encontrado')
    const userCoord = await prisma.user.findUnique({ where: { id: coord.userId } })
    const estados = userCoord?.estados ?? []
    const where = { user: { estado: { in: estados } } }
    const [list, total] = await Promise.all([
      prisma.multiplicador.findMany({
        where,
        include: { user: { omit: { senhaHash: true } } },
        orderBy: { user: { nome: 'asc' } },
        skip,
        take: limit,
      }),
      prisma.multiplicador.count({ where }),
    ])
    return c.json({ multiplicadoras: list, total, page, limit, pages: Math.ceil(total / limit) })
  }

  const [list, total] = await Promise.all([
    prisma.multiplicador.findMany({
      include: { user: { omit: { senhaHash: true } } },
      orderBy: { user: { nome: 'asc' } },
      skip,
      take: limit,
    }),
    prisma.multiplicador.count(),
  ])
  return c.json({ multiplicadoras: list, total, page, limit, pages: Math.ceil(total / limit) })
})

// GET /multiplicadoras/:id
multiplicadores.get('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  if (user.perfil === 'multiplicadora' && user.multiplicadoraId !== id) {
    return forbidden(c)
  }

  const mult = await prisma.multiplicador.findUnique({
    where: { id },
    include: { user: { omit: { senhaHash: true } }, rodas: true },
  })
  if (!mult) return notFound(c)

  // Coordenador só vê multiplicadoras do seu escopo de estado
  if (user.perfil === 'coordenador') {
    const coord = await prisma.coordenador.findUnique({ where: { id: user.coordenadorId! } })
    if (!coord) return forbidden(c)
    const userCoord = await prisma.user.findUnique({ where: { id: coord.userId } })
    const estados = userCoord?.estados ?? []
    if (!estados.includes(mult.user.estado ?? '')) return forbidden(c)
  }

  return c.json({ multiplicadora: mult })
})

// PUT /multiplicadoras/:id — GAP 1: endpoint faltando
multiplicadores.put('/:id', zValidator('json', AtualizarMultiplicadoraSchema), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  // Multiplicadora só pode atualizar o próprio perfil; coord/admin podem atualizar qualquer uma
  if (user.perfil === 'multiplicadora' && user.multiplicadoraId !== id) {
    return forbidden(c)
  }

  const mult = await prisma.multiplicador.findUnique({ where: { id }, include: { user: true } })
  if (!mult) return notFound(c)

  // Coordenador só pode atualizar multiplicadoras do seu estado
  if (user.perfil === 'coordenador') {
    const coord = await prisma.coordenador.findUnique({ where: { id: user.coordenadorId! } })
    if (!coord) return forbidden(c)
    const userCoord = await prisma.user.findUnique({ where: { id: coord.userId } })
    const estados = userCoord?.estados ?? []
    if (!estados.includes(mult.user.estado ?? '')) return forbidden(c)
  }

  const data = c.req.valid('json')
  const { nome, telefone, municipio, bairro } = data

  await prisma.user.update({
    where: { id: mult.userId },
    data: { nome, telefone, municipio, bairro },
  })

  const updated = await prisma.multiplicador.findUnique({
    where: { id },
    include: { user: { omit: { senhaHash: true } } },
  })
  return c.json({ multiplicadora: updated })
})

// POST /multiplicadoras/:id/solicitar-validacao
multiplicadores.post('/:id/solicitar-validacao', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  if (user.perfil !== 'multiplicadora' || user.multiplicadoraId !== id) {
    return forbidden(c)
  }

  const mult = await prisma.multiplicador.findUnique({ where: { id } })
  if (!mult) return notFound(c)
  if (mult.status !== 'em_formacao') return badRequest(c, 'Status inválido para solicitação')

  const estado = (await prisma.user.findUnique({ where: { id: mult.userId } }))?.estado ?? ''
  const config = await prisma.configuracaoEstado.findUnique({ where: { estado } })
  const minimo = config?.minimoRodas ?? 5

  if (mult.rodasRealizadas < minimo) {
    return badRequest(c, `Mínimo de ${minimo} rodas necessário (${mult.rodasRealizadas} realizadas)`)
  }

  const updated = await prisma.multiplicador.update({
    where: { id },
    data: { status: 'aguardando_validacao' },
  })
  return c.json({ multiplicadora: updated })
})

// POST /multiplicadoras/:id/ativar
multiplicadores.post('/:id/ativar', requirePerfil('administrador'), async (c) => {
  const id = c.req.param('id')
  const mult = await prisma.multiplicador.findUnique({ where: { id } })
  if (!mult) return notFound(c)
  await prisma.user.update({ where: { id: mult.userId }, data: { ativo: true } })
  return c.json({ ok: true })
})

// POST /multiplicadoras/:id/desativar
multiplicadores.post('/:id/desativar', requirePerfil('administrador'), async (c) => {
  const id = c.req.param('id')
  const mult = await prisma.multiplicador.findUnique({ where: { id } })
  if (!mult) return notFound(c)
  await prisma.user.update({ where: { id: mult.userId }, data: { ativo: false } })
  return c.json({ ok: true })
})

// GET /multiplicadoras/:id/certificado
multiplicadores.get('/:id/certificado', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  if (user.perfil === 'multiplicadora' && user.multiplicadoraId !== id) {
    return forbidden(c)
  }

  const mult = await prisma.multiplicador.findUnique({
    where: { id },
    include: { user: { omit: { senhaHash: true } } },
  })
  if (!mult) return notFound(c)
  if (mult.status !== 'formado' || !mult.certificadoEmitido) {
    return c.json({ error: 'Certificado não disponível' }, 403)
  }

  return c.json({
    certificado: {
      id: mult.id,
      nome: mult.user.nome,
      email: mult.user.email,
      municipio: mult.user.municipio,
      estado: mult.user.estado,
      dataIngresso: mult.dataIngresso,
      dataConclusao: mult.dataConclusao,
      rodasRealizadas: mult.rodasRealizadas,
      pessoasImpactadas: mult.pessoasImpactadas,
      emitidoEm: new Date().toISOString(),
    },
  })
})

export default multiplicadores
