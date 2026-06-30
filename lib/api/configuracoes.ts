import { api } from './client'
import type { ConfiguracaoEstado } from '@/lib/types'

export async function getConfiguracoes() {
  return api.get<{ configuracoes: ConfiguracaoEstado[] }>('/configuracoes')
}

export async function getMinimoRodasApi(estado: string): Promise<number> {
  const res = await api.get<{ minimoRodas: number }>(`/configuracoes/${estado}`)
  return res.minimoRodas
}

export async function atualizarMinimoRodasApi(estado: string, minimoRodas: number) {
  return api.put<{ configuracao: ConfiguracaoEstado }>(`/configuracoes/${estado}`, { minimoRodas })
}
