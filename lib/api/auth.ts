import { api } from './client'
import type { UsuarioAtual } from '@/lib/types'

export interface LoginResponse {
  token: string
  usuario: UsuarioAtual
}

export async function loginApi(email: string, senha: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { email, senha })
}

export async function getMeApi(): Promise<{ usuario: UsuarioAtual }> {
  return api.get<{ usuario: UsuarioAtual }>('/auth/me')
}

export async function logoutApi(): Promise<void> {
  await api.post('/auth/logout')
}

export async function trocarSenhaApi(senhaAtual: string, novaSenha: string): Promise<void> {
  await api.post('/auth/trocar-senha', { senhaAtual, novaSenha })
}
