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

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
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
