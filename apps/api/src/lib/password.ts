import bcrypt from 'bcryptjs'

export async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function compare(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

export function validate(senha: string): string | null {
  if (senha.length < 6) return 'Mínimo 6 caracteres'
  if (!/[A-Za-z]/.test(senha)) return 'Deve conter pelo menos uma letra'
  return null
}
