import { api } from './client'
import type { Roda } from '@/lib/types'

export async function getRodas() {
  return api.get<{ rodas: Roda[] }>('/rodas')
}

export async function criarRodaApi(dados: Omit<Roda, 'id'>) {
  return api.post<{ roda: Roda }>('/rodas', dados)
}

export async function atualizarRodaApi(id: string, dados: Partial<Roda>) {
  return api.put<{ roda: Roda }>(`/rodas/${id}`, dados)
}

export async function importarRodasApi(rodas: Omit<Roda, 'id'>[]) {
  return api.post<{ criadas: number }>('/rodas/importar', { rodas })
}
