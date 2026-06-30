import { api } from './client'

export async function exportarDadosApi(): Promise<Blob> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
  const token = typeof window !== 'undefined' ? localStorage.getItem('gmb_token') : null
  const res = await fetch(`${BASE_URL}/lgpd/exportar`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Erro ao exportar dados')
  return res.blob()
}

export async function solicitarLGPDApi(tipo: 'exclusao' | 'correcao', descricao?: string) {
  return api.post('/lgpd/solicitar', { tipo, descricao })
}
