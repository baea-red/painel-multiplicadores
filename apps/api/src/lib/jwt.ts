import { SignJWT, jwtVerify } from 'jose'

export interface JWTPayload {
  sub: string
  email: string
  perfil: string
  nome: string
  multiplicadoraId?: string
  coordenadorId?: string
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)

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
