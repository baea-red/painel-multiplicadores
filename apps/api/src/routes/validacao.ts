import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePerfil } from '../middleware/auth.js'
import { notFound, badRequest, forbidden } from '../lib/errors.js'

const validacao = new Hono()

validacao.use('*', requireAuth)

// Helper — retorna os estados do coordenador logado
async function getEstadosCoordenador(coordenadorId: string): Promise<string[]> {
  const coord = await prisma.coordenador.findUnique({ where: { id: coordenadorId } })
  if (!coord) return []
  const userCoord = await prisma.user.findUnique({ where: { id: coord.userId } })
  return userCoord?.estados ?? []
}

// GET /validacao
validacao.get('/', requirePerfil('coordenador', 'administrador'), async (c) => {
  const user = c.get('user')

  const page = Number(c.req.query('page') ?? '1')
  const limit = Math.min(Number(c.req.query('limit') ?? '20'), 100)
  const skip = (Math.max(page, 1) - 1) * limit

  if (user.perfil === 'coordenador') {
    const estados = await getEstadosCoordenador(user.coordenadorId!)
    const where = { status: 'aguardando_validacao', user: { estado: { in: estados } } } as const
    const [pendentes, total] = await Promise.all([
      prisma.multiplicador.findMany({
        where,
        include: { user: { omit: { senhaHash: true } }, rodas: true },
        orderBy: { dataIngresso: 'asc' },
        skip,
        take: limit,
      }),
      prisma.multiplicador.count({ where }),
    ])
    return c.json({ pendentes, total, page, limit, pages: Math.ceil(total / limit) })
  }

  const where = { status: 'aguardando_validacao' } as const
  const [pendentes, total] = await Promise.all([
    prisma.multiplicador.findMany({
      where,
      include: { user: { omit: { senhaHash: true } }, rodas: true },
      orderBy: { dataIngresso: 'asc' },
      skip,
      take: limit,
    }),
    prisma.multiplicador.count({ where }),
  ])
  return c.json({ pendentes, total, page, limit, pages: Math.ceil(total / limit), readOnly: true })
})

// POST /validacao/:id/aprovar — GAP 4: validar escopo de estado
validacao.post('/:id/aprovar', requirePerfil('coordenador'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const mult = await prisma.multiplicador.findUnique({
    where: { id },
    include: { user: { select: { estado: true } } },
  })
  if (!mult) return notFound(c)
  if (mult.status !== 'aguardando_validacao') {
    return badRequest(c, 'Multiplicadora não está aguardando validação')
  }

  // Coordenador só pode aprovar multiplicadoras do seu escopo de estado
  const estados = await getEstadosCoordenador(user.coordenadorId!)
  if (!estados.includes(mult.user.estado)) {
    return forbidden(c)
  }

  const updated = await prisma.multiplicador.update({
    where: { id },
    data: { status: 'formado', dataConclusao: new Date(), certificadoEmitido: true },
  })
  return c.json({ multiplicadora: updated })
})

// POST /validacao/:id/reprovar — GAP 5: validar escopo de estado
validacao.post('/:id/reprovar', requirePerfil('coordenador'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const mult = await prisma.multiplicador.findUnique({
    where: { id },
    include: { user: { select: { estado: true } } },
  })
  if (!mult) return notFound(c)
  if (mult.status !== 'aguardando_validacao') {
    return badRequest(c, 'Multiplicadora não está aguardando validação')
  }

  const estados = await getEstadosCoordenador(user.coordenadorId!)
  if (!estados.includes(mult.user.estado)) {
    return forbidden(c)
  }

  const updated = await prisma.multiplicador.update({
    where: { id },
    data: { status: 'inativo' },
  })
  return c.json({ multiplicadora: updated })
})

export default validacao
