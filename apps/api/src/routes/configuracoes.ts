import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ConfiguracaoEstadoSchema } from '@gmb/schema'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePerfil } from '../middleware/auth.js'

const configuracoes = new Hono()

configuracoes.use('*', requireAuth)

// GET /configuracoes — all state configs
configuracoes.get('/', async (c) => {
  const configs = await prisma.configuracaoEstado.findMany({ orderBy: { estado: 'asc' } })
  return c.json({ configuracoes: configs })
})

// GET /configuracoes/:estado
configuracoes.get('/:estado', async (c) => {
  const estado = c.req.param('estado').toUpperCase()
  const config = await prisma.configuracaoEstado.findUnique({ where: { estado } })
  return c.json({ minimoRodas: config?.minimoRodas ?? 5 })
})

// PUT /configuracoes/:estado — admin only (REGRAS §1.3)
configuracoes.put(
  '/:estado',
  requirePerfil('administrador'),
  zValidator('json', ConfiguracaoEstadoSchema),
  async (c) => {
    const estado = c.req.param('estado').toUpperCase()
    const { minimoRodas } = c.req.valid('json')
    const config = await prisma.configuracaoEstado.upsert({
      where: { estado },
      update: { minimoRodas },
      create: { estado, minimoRodas },
    })
    return c.json({ configuracao: config })
  }
)

export default configuracoes
