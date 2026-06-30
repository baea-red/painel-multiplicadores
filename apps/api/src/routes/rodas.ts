import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CriarRodaSchema, AtualizarRodaSchema } from '@gmb/schema'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePerfil } from '../middleware/auth.js'
import { notFound, forbidden } from '../lib/errors.js'

const rodas = new Hono()

rodas.use('*', requireAuth)

// GET /rodas
rodas.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const limit = Math.min(Number(c.req.query('limit') ?? '20'), 100)
  const skip = (page - 1) * limit

  if (user.perfil === 'multiplicadora') {
    const where = { multiplicadoraId: user.multiplicadoraId }
    const [rodas, total] = await Promise.all([
      prisma.roda.findMany({
        where,
        orderBy: { dataInicio: 'desc' },
        skip,
        take: limit,
      }),
      prisma.roda.count({ where }),
    ])
    return c.json({ rodas, total, page, limit, pages: Math.ceil(total / limit) })
  }

  if (user.perfil === 'coordenador') {
    const where = { coordenadorId: user.coordenadorId }
    const [rodas, total] = await Promise.all([
      prisma.roda.findMany({
        where,
        orderBy: { dataInicio: 'desc' },
        skip,
        take: limit,
        include: { multiplicadora: { include: { user: { omit: { senhaHash: true } } } } },
      }),
      prisma.roda.count({ where }),
    ])
    return c.json({ rodas, total, page, limit, pages: Math.ceil(total / limit) })
  }

  const where = {}
  const [rodas, total] = await Promise.all([
    prisma.roda.findMany({
      where,
      orderBy: { dataInicio: 'desc' },
      skip,
      take: limit,
      include: { multiplicadora: { include: { user: { omit: { senhaHash: true } } } }, coordenador: true },
    }),
    prisma.roda.count({ where }),
  ])
  return c.json({ rodas, total, page, limit, pages: Math.ceil(total / limit) })
})

// GET /rodas/:id
rodas.get('/:id', async (c) => {
  const user = c.get('user')
  const roda = await prisma.roda.findUnique({
    where: { id: c.req.param('id') },
    include: { multiplicadora: true, coordenador: true, documentos: true },
  })
  if (!roda) return notFound(c)
  if (user.perfil === 'multiplicadora' && roda.multiplicadoraId !== user.multiplicadoraId) {
    return forbidden(c)
  }
  return c.json({ roda })
})

// POST /rodas
rodas.post('/', requirePerfil('coordenador', 'administrador'), zValidator('json', CriarRodaSchema), async (c) => {
  const data = c.req.valid('json')
  const roda = await prisma.roda.create({
    data: {
      ...data,
      dataInicio: new Date(data.dataInicio),
      dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
    },
  })
  // Update multiplicadora KPIs
  await recalcularKPIs(data.multiplicadoraId)
  return c.json({ roda }, 201)
})

// PUT /rodas/:id
rodas.put('/:id', requirePerfil('coordenador', 'administrador'), zValidator('json', AtualizarRodaSchema), async (c) => {
  const id = c.req.param('id')
  const existing = await prisma.roda.findUnique({ where: { id } })
  if (!existing) return notFound(c)
  const data = c.req.valid('json')
  const roda = await prisma.roda.update({
    where: { id },
    data: {
      ...data,
      dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
      dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
    },
  })
  await recalcularKPIs(roda.multiplicadoraId)
  return c.json({ roda })
})

// POST /rodas/importar — bulk import
rodas.post('/importar', requirePerfil('coordenador', 'administrador'), async (c) => {
  const body = await c.req.json()
  const rodasList: typeof CriarRodaSchema._type[] = body.rodas ?? []
  if (!Array.isArray(rodasList) || rodasList.length === 0) {
    return c.json({ error: 'Nenhuma roda para importar' }, 400)
  }
  const created = await prisma.$transaction(
    rodasList.map(r =>
      prisma.roda.create({
        data: {
          ...r,
          dataInicio: new Date(r.dataInicio),
          dataFim: r.dataFim ? new Date(r.dataFim) : undefined,
        },
      })
    )
  )
  // Recalc KPIs for unique multiplicadores in the import
  const ids = [...new Set(rodasList.map(r => r.multiplicadoraId))]
  await Promise.all(ids.map(recalcularKPIs))
  return c.json({ criadas: created.length, rodas: created }, 201)
})

type RodaRow = { status: string; participantes: number; municipio: string }

async function recalcularKPIs(multiplicadoraId: string) {
  const rodasDaMult = (await prisma.roda.findMany({ where: { multiplicadoraId } })) as RodaRow[]
  const rodasRealizadas = rodasDaMult.filter(r => r.status === 'concluida').length
  const pessoasImpactadas = rodasDaMult.reduce((s, r) => s + r.participantes, 0)
  const municipiosAtendidos = new Set(rodasDaMult.map(r => r.municipio)).size
  await prisma.multiplicador.update({
    where: { id: multiplicadoraId },
    data: { rodasRealizadas, pessoasImpactadas, municipiosAtendidos },
  })
}

export default rodas
