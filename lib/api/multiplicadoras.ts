import { api } from './client'
import type { Multiplicador } from '@/lib/types'

export async function getMultiplicadores() {
  return api.get<{ multiplicadoras: Multiplicador[] }>('/multiplicadoras')
}

export async function criarMultiplicadoraApi(dados: {
  nome: string; email: string; telefone: string
  municipio: string; estado: string; bairro: string; senhaProvisoria: string
}) {
  return api.post('/usuarios', { ...dados, perfil: 'multiplicadora' })
}

export async function ativarApi(id: string) {
  return api.post(`/multiplicadoras/${id}/ativar`)
}

export async function desativarApi(id: string) {
  return api.post(`/multiplicadoras/${id}/desativar`)
}

export async function solicitarValidacaoApi(id: string) {
  return api.post(`/multiplicadoras/${id}/solicitar-validacao`)
}

export async function aprovarApi(id: string) {
  return api.post(`/validacao/${id}/aprovar`)
}

export async function reprovarApi(id: string) {
  return api.post(`/validacao/${id}/reprovar`)
}

export interface CertificadoData {
  id: string; nome: string; email: string
  municipio: string | null; estado: string | null
  dataIngresso: string; dataConclusao: string | null
  rodasRealizadas: number; pessoasImpactadas: number
  emitidoEm: string
}

export async function getCertificadoApi(id: string): Promise<{ certificado: CertificadoData }> {
  return api.get(`/multiplicadoras/${id}/certificado`)
}

export async function atualizarMultiplicadoraApi(id: string, dados: Partial<import('@/lib/types').Multiplicador>) {
  return api.put(`/multiplicadoras/${id}`, dados)
}

export async function getMultiplicadoresPaginado(page = 1, limit = 20) {
  return api.get<{
    multiplicadoras: import('@/lib/types').Multiplicador[]
    total: number; page: number; limit: number; pages: number
  }>(`/multiplicadoras?page=${page}&limit=${limit}`)
}
