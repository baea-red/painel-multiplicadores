import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { LoginSchema } from '@gmb/schema'
import { prisma } from '../lib/prisma.js'
import { compare, hash, validate as validateSenha } from '../lib/password.js'
import { sign } from '../lib/jwt.js'
import { requireAuth } from '../middleware/auth.js'
import { unauthorized } from '../lib/errors.js'

const auth = new Hono()

// POST /auth/login
auth.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, senha } = c.req.valid('json')

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { multiplicadora: true, coordenador: true },
  })

  if (!user) return unauthorized(c, 'E-mail ou senha incorretos')
  if (!user.ativo) return unauthorized(c, 'Conta desativada. Entre em contato com a coordenação.')

  const senhaValida = await compare(senha, user.senhaHash)
  if (!senhaValida) return unauthorized(c, 'E-mail ou senha incorretos')

  const token = await sign({
    sub: user.id,
    email: user.email,
    perfil: user.perfil,
    nome: user.nome,
    multiplicadoraId: user.multiplicadora?.id,
    coordenadorId: user.coordenador?.id,
  })

  return c.json({
    token,
    usuario: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      multiplicadoraId: user.multiplicadora?.id,
      coordenadorId: user.coordenador?.id,
    },
  })
})

// GET /auth/me
auth.get('/me', requireAuth, async (c) => {
  const { sub } = c.get('user')
  const user = await prisma.user.findUnique({
    where: { id: sub },
    include: { multiplicadora: true, coordenador: true },
    omit: { senhaHash: true },
  })
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404)
  return c.json({ usuario: user })
})

// POST /auth/logout (stateless — client drops the token)
auth.post('/logout', requireAuth, (c) => c.json({ ok: true }))

// POST /auth/trocar-senha
auth.post('/trocar-senha', requireAuth, async (c) => {
  const { senhaAtual, novaSenha } = await c.req.json()
  const { sub } = c.get('user')

  const user = await prisma.user.findUnique({ where: { id: sub } })
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404)

  const senhaValida = await compare(senhaAtual, user.senhaHash)
  if (!senhaValida) return c.json({ error: 'Senha atual incorreta' }, 400)

  const erro = validateSenha(novaSenha)
  if (erro) return c.json({ error: erro }, 400)

  await prisma.user.update({ where: { id: sub }, data: { senhaHash: await hash(novaSenha) } })
  return c.json({ ok: true })
})

export default auth
