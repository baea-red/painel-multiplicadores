import { createMiddleware } from 'hono/factory'
import { verify, type JWTPayload } from '../lib/jwt.js'

declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Token não fornecido' }, 401)
  }
  const token = authHeader.slice(7)
  const payload = await verify(token)
  if (!payload) {
    return c.json({ error: 'Token inválido ou expirado' }, 401)
  }
  c.set('user', payload)
  await next()
})

export const requirePerfil = (...perfis: string[]) =>
  createMiddleware(async (c, next) => {
    const user = c.get('user')
    if (!perfis.includes(user.perfil)) {
      return c.json({ error: 'Sem permissão para esta ação' }, 403)
    }
    await next()
  })
