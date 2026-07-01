import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import authRoutes from './routes/auth.js'
import multiplicadorasRoutes from './routes/multiplicadoras.js'
import rodasRoutes from './routes/rodas.js'
import validacaoRoutes from './routes/validacao.js'
import configuracoesRoutes from './routes/configuracoes.js'
import usuariosRoutes from './routes/usuarios.js'
import lgpdRoutes from './routes/lgpd.js'
import uploadRoutes from './routes/upload.js'

const app = new Hono().basePath('/api')

// ── Rate limiter simples em memória (GAP 8) ────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

function rateLimitLogin(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// Limpa entradas expiradas a cada 5 min
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of loginAttempts.entries()) {
    if (now > val.resetAt) loginAttempts.delete(key)
  }
}, 300_000)

// ── Global middleware ──────────────────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'
if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
  throw new Error('FRONTEND_URL não configurada. Defina a variável de ambiente antes de iniciar em produção.')
}

app.use(
  '*',
  cors({
    origin: FRONTEND_URL,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)
app.use('*', logger())
app.use('*', prettyJSON())
app.use('/uploads/*', serveStatic({ root: './' }))

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

// ── Routes ─────────────────────────────────────────────────────────────────────
// Rate limit na rota de login
app.use('/auth/login', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
  if (!rateLimitLogin(ip)) {
    return c.json({ error: 'Muitas tentativas. Aguarde 1 minuto.' }, 429)
  }
  await next()
})

app.route('/auth', authRoutes)
app.route('/multiplicadoras', multiplicadorasRoutes)
app.route('/rodas', rodasRoutes)
app.route('/validacao', validacaoRoutes)
app.route('/configuracoes', configuracoesRoutes)
app.route('/usuarios', usuariosRoutes)
app.route('/lgpd', lgpdRoutes)
app.route('/upload', uploadRoutes)

// ── 404 handler ────────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Rota não encontrada' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Erro interno do servidor' }, 500)
})

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀  API GMB rodando em http://localhost:${PORT}/api`)
})

export default app
