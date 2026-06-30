import type { Context } from 'hono'

export function badRequest(c: Context, message: string) {
  return c.json({ error: message }, 400)
}

export function unauthorized(c: Context, message = 'Não autorizado') {
  return c.json({ error: message }, 401)
}

export function forbidden(c: Context, message = 'Sem permissão') {
  return c.json({ error: message }, 403)
}

export function notFound(c: Context, message = 'Não encontrado') {
  return c.json({ error: message }, 404)
}

export function conflict(c: Context, message: string) {
  return c.json({ error: message }, 409)
}
