import bcrypt from 'bcryptjs'

export async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function compare(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

export function validate(senha: string): string | null {
  if (senha.length < 8) return 'Mínimo 8 caracteres'
  if (!/[A-Z]/.test(senha)) return 'Deve conter pelo menos uma letra maiúscula'
  if (!/[0-9]/.test(senha)) return 'Deve conter pelo menos um número'
  return null
}
