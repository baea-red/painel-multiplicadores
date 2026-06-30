import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { SolicitacaoLGPDSchema } from '@gmb/schema'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const lgpd = new Hono()

lgpd.use('*', requireAuth)

// GET /lgpd/exportar — export all own data (LGPD Art. 18)
lgpd.get('/exportar', async (c) => {
  const { sub, perfil } = c.get('user')

  const user = await prisma.user.findUnique({
    where: { id: sub },
    omit: { senhaHash: true },
    include: { multiplicadora: { include: { rodas: true } }, coordenador: true },
  })

  const solicitacoes = await prisma.solicitacaoLGPD.findMany({ where: { userId: sub } })

  const exportData = {
    exportadoEm: new Date().toISOString(),
    usuario: user,
    solicitacoesLGPD: solicitacoes,
  }

  c.header('Content-Disposition', 'attachment; filename="meus-dados-gmb.json"')
  c.header('Content-Type', 'application/json')
  return c.body(JSON.stringify(exportData, null, 2))
})

// POST /lgpd/solicitar — request deletion or correction (LGPD Art. 18)
lgpd.post('/solicitar', zValidator('json', SolicitacaoLGPDSchema), async (c) => {
  const { sub } = c.get('user')
  const { tipo, descricao } = c.req.valid('json')

  const solicitacao = await prisma.solicitacaoLGPD.create({
    data: { userId: sub, tipo, descricao },
  })

  return c.json({ solicitacao, mensagem: 'Solicitação registrada. Responderemos em até 15 dias úteis.' }, 201)
})

export default lgpd
