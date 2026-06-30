import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePerfil } from '../middleware/auth.js'
import { notFound, badRequest } from '../lib/errors.js'

const validacao = new Hono()

validacao.use('*', requireAuth)

// GET /validacao — pending queue, scoped to coordinator's estados
validacao.get('/', requirePerfil('coordenador', 'administrador'), async (c) => {
  const user = c.get('user')

  if (user.perfil === 'coordenador') {
    const coord = await prisma.coordenador.findUnique({ where: { id: user.coordenadorId } })
    if (!coord) return notFound(c, 'Coordenador não encontrado')
    const userCoord = await prisma.user.findUnique({ where: { id: coord.userId } })
    const estados = userCoord?.estados ?? []

    const pendentes = await prisma.multiplicador.findMany({
      where: {
        status: 'aguardando_validacao',
        user: { estado: { in: estados } },
      },
      include: { user: { omit: { senhaHash: true } }, rodas: true },
      orderBy: { dataIngresso: 'asc' },
    })
    return c.json({ pendentes })
  }

  // administrador — read-only view of all pending (cannot approve per REGRAS §1.2)
  const pendentes = await prisma.multiplicador.findMany({
    where: { status: 'aguardando_validacao' },
    include: { user: { omit: { senhaHash: true } }, rodas: true },
    orderBy: { dataIngresso: 'asc' },
  })
  return c.json({ pendentes, readOnly: true })
})

// POST /validacao/:id/aprovar — coordenador only (REGRAS §1.2)
validacao.post('/:id/aprovar', requirePerfil('coordenador'), async (c) => {
  const id = c.req.param('id')
  const mult = await prisma.multiplicador.findUnique({ where: { id } })
  if (!mult) return notFound(c)
  if (mult.status !== 'aguardando_validacao') {
    return badRequest(c, 'Multiplicadora não está aguardando validação')
  }
  const updated = await prisma.multiplicador.update({
    where: { id },
    data: {
      status: 'formado',
      dataConclusao: new Date(),
      certificadoEmitido: true,
    },
  })
  return c.json({ multiplicadora: updated })
})

// POST /validacao/:id/reprovar — coordenador only (REGRAS §1.2)
validacao.post('/:id/reprovar', requirePerfil('coordenador'), async (c) => {
  const id = c.req.param('id')
  const mult = await prisma.multiplicador.findUnique({ where: { id } })
  if (!mult) return notFound(c)
  if (mult.status !== 'aguardando_validacao') {
    return badRequest(c, 'Multiplicadora não está aguardando validação')
  }
  const updated = await prisma.multiplicador.update({
    where: { id },
    data: { status: 'inativo' },
  })
  return c.json({ multiplicadora: updated })
})

export default validacao
