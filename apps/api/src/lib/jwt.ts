import { SignJWT, jwtVerify } from 'jose'

export interface JWTPayload {
  sub: string
  email: string
  perfil: string
  nome: string
  multiplicadoraId?: string
  coordenadorId?: string
}

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET não configurada. Defina a variável de ambiente antes de iniciar em produção.')
}
const secret = new TextEncoder().encode(jwtSecret ?? 'dev-secret-local-only')

const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

export async function sign(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secret)
}

export async function verify(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}
