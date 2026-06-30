'use client'

import { createContext, useContext, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { multiplicadores as mockData, rodas as mockRodas } from '@/lib/data/mock'
import type { Multiplicador, ConfiguracaoEstado, Roda } from '@/lib/types'
import { IS_MOCK_MODE } from '@/lib/api/client'
import { getMultiplicadores, criarMultiplicadoraApi, ativarApi, desativarApi, solicitarValidacaoApi, aprovarApi, reprovarApi, atualizarMultiplicadoraApi } from '@/lib/api/multiplicadoras'
import { getRodas, importarRodasApi, atualizarRodaApi } from '@/lib/api/rodas'
import { getConfiguracoes, atualizarMinimoRodasApi } from '@/lib/api/configuracoes'

const MINIMO_PADRAO = 5

const CONFIG_INICIAL: ConfiguracaoEstado[] = [
  { estado: 'CE', minimoRodas: 5 },
  { estado: 'SP', minimoRodas: 5 },
  { estado: 'BA', minimoRodas: 5 },
]

interface NovaMultiplicadora {
  nome: string; email: string; telefone: string
  municipio: string; estado: string; bairro: string; senhaProvisoria: string
}

interface MultiplicadoresContextValue {
  multiplicadores: Multiplicador[]
  configuracoes: ConfiguracaoEstado[]
  rodas: Roda[]
  isLoading: boolean
  getMinimoRodas: (estado: string, mult?: Multiplicador) => number
  atualizarMinimoRodas: (estado: string, minimo: number, onErro?: () => void) => void
  atualizarMultiplicadora: (id: string, dados: Partial<Multiplicador>, onSuccess?: () => void) => void
  solicitarValidacao: (id: string, onSuccess?: () => void) => void
  aprovar: (id: string) => void
  reprovar: (id: string) => void
  criarMultiplicadora: (dados: NovaMultiplicadora) => void
  ativar: (id: string) => void
  desativar: (id: string) => void
  adicionarRodas: (rodas: Roda[], onSuccess?: () => void) => void
  atualizarRoda: (id: string, dados: Partial<Roda>, onSuccess?: () => void) => void
}

const MultiplicadoresContext = createContext<MultiplicadoresContextValue | null>(null)

// ── Mock provider (no API configured) ────────────────────────────────────────
function MockProvider({ children }: { children: React.ReactNode }) {
  const [multiplicadoras, setMultiplicadores] = useState<Multiplicador[]>(mockData)
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoEstado[]>(CONFIG_INICIAL)
  const [proximoId, setProximoId] = useState(mockData.length + 1)
  const [rodas, setRodas] = useState<Roda[]>(mockRodas)

  function getMinimoRodas(estado: string, mult?: Multiplicador) {
    if (mult?.minimoRodasContratado !== undefined &&
        (mult.status === 'em_formacao' || mult.status === 'aguardando_validacao' || mult.status === 'formado')) {
      return mult.minimoRodasContratado
    }
    return configuracoes.find(c => c.estado === estado)?.minimoRodas ?? MINIMO_PADRAO
  }

  function atualizarMinimoRodas(estado: string, minimo: number, _onErro?: () => void) {
    setConfiguracoes(prev => {
      const existe = prev.find(c => c.estado === estado)
      if (existe) return prev.map(c => c.estado === estado ? { ...c, minimoRodas: minimo } : c)
      return [...prev, { estado, minimoRodas: minimo }]
    })
  }

  function atualizarMultiplicadora(id: string, dados: Partial<Multiplicador>, onSuccess?: () => void) {
    setMultiplicadores(prev => prev.map(m => m.id === id ? { ...m, ...dados } : m))
    onSuccess?.()
  }

  function solicitarValidacao(id: string, onSuccess?: () => void) {
    setMultiplicadores(prev => prev.map(m => m.id === id ? { ...m, status: 'aguardando_validacao' } : m))
    onSuccess?.()
  }

  function aprovar(id: string) {
    const hoje = new Date().toISOString().split('T')[0]
    setMultiplicadores(prev => prev.map(m => m.id === id ? { ...m, status: 'formado', dataConclusao: hoje } : m))
  }

  function reprovar(id: string) {
    setMultiplicadores(prev => prev.map(m => m.id === id ? { ...m, status: 'inativo' } : m))
  }

  function criarMultiplicadora(dados: NovaMultiplicadora) {
    const nova: Multiplicador = {
      id: `m${proximoId}`, nome: dados.nome, email: dados.email, telefone: dados.telefone,
      municipio: dados.municipio, estado: dados.estado, bairro: dados.bairro,
      ativo: true, status: 'em_formacao', dataIngresso: new Date().toISOString().split('T')[0],
      certificadoEmitido: false, rodasRealizadas: 0, pessoasImpactadas: 0, municipiosAtendidos: 0,
      minimoRodasContratado: getMinimoRodas(dados.estado),
    }
    setMultiplicadores(prev => [...prev, nova])
    setProximoId(n => n + 1)
  }

  function ativar(id: string) { setMultiplicadores(prev => prev.map(m => m.id === id ? { ...m, ativo: true } : m)) }
  function desativar(id: string) { setMultiplicadores(prev => prev.map(m => m.id === id ? { ...m, ativo: false } : m)) }
  function adicionarRodas(novas: Roda[], onSuccess?: () => void) { setRodas(prev => [...prev, ...novas]); onSuccess?.() }
  function atualizarRoda(id: string, dados: Partial<Roda>, onSuccess?: () => void) { setRodas(prev => prev.map(r => r.id === id ? { ...r, ...dados } : r)); onSuccess?.() }

  return (
    <MultiplicadoresContext value={{ multiplicadores: multiplicadoras, configuracoes, rodas, isLoading: false, getMinimoRodas, atualizarMinimoRodas, atualizarMultiplicadora, solicitarValidacao, aprovar, reprovar, criarMultiplicadora, ativar, desativar, adicionarRodas, atualizarRoda }}>
      {children}
    </MultiplicadoresContext>
  )
}

// ── API provider (NEXT_PUBLIC_API_URL configured) ─────────────────────────────
function ApiProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()

  const { data: multData, isLoading: loadingMult } = useQuery({
    queryKey: ['multiplicadores'],
    queryFn: getMultiplicadores,
  })
  const { data: rodasData, isLoading: loadingRodas } = useQuery({
    queryKey: ['rodas'],
    queryFn: getRodas,
  })
  const { data: configData } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: getConfiguracoes,
    initialData: { configuracoes: CONFIG_INICIAL },
  })

  const multiplicadores = multData?.multiplicadoras ?? []
  const rodas = rodasData?.rodas ?? []
  const configuracoes = configData?.configuracoes ?? CONFIG_INICIAL
  const isLoading = loadingMult || loadingRodas

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['multiplicadores'] })
    qc.invalidateQueries({ queryKey: ['rodas'] })
  }

  function getMinimoRodas(estado: string, mult?: Multiplicador) {
    if (mult?.minimoRodasContratado !== undefined &&
        (mult.status === 'em_formacao' || mult.status === 'aguardando_validacao' || mult.status === 'formado')) {
      return mult.minimoRodasContratado
    }
    return configuracoes.find(c => c.estado === estado)?.minimoRodas ?? MINIMO_PADRAO
  }

  const atualizarM = useMutation({ mutationFn: ({ id, dados }: { id: string; dados: Partial<Multiplicador> }) => atualizarMultiplicadoraApi(id, dados), onSuccess: invalidate })
  const ativarM = useMutation({ mutationFn: ativarApi, onSuccess: invalidate })
  const desativarM = useMutation({ mutationFn: desativarApi, onSuccess: invalidate })
  const solicitarM = useMutation({ mutationFn: solicitarValidacaoApi, onSuccess: invalidate })
  const aprovarM = useMutation({ mutationFn: aprovarApi, onSuccess: invalidate })
  const reprovarM = useMutation({ mutationFn: reprovarApi, onSuccess: invalidate })
  const criarM = useMutation({
    mutationFn: criarMultiplicadoraApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['multiplicadores'] }),
  })
  const importarM = useMutation({ mutationFn: importarRodasApi, onSuccess: invalidate })
  const atualizarRodaM = useMutation({ mutationFn: ({ id, dados }: { id: string; dados: Partial<Roda> }) => atualizarRodaApi(id, dados), onSuccess: invalidate })
  const configM = useMutation({
    mutationFn: ({ estado, minimo }: { estado: string; minimo: number }) =>
      atualizarMinimoRodasApi(estado, minimo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configuracoes'] }),
  })

  function criarMultiplicadora(dados: NovaMultiplicadora) { criarM.mutate(dados) }

  return (
    <MultiplicadoresContext value={{
      multiplicadores, configuracoes, rodas, isLoading,
      getMinimoRodas,
      atualizarMinimoRodas: (estado, minimo, onErro) => configM.mutate({ estado, minimo }, { onError: onErro }),
      atualizarMultiplicadora: (id, dados, onSuccess) => atualizarM.mutate({ id, dados }, { onSuccess }),
      solicitarValidacao: (id, onSuccess) => solicitarM.mutate(id, { onSuccess }),
      aprovar: (id) => aprovarM.mutate(id),
      reprovar: (id) => reprovarM.mutate(id),
      criarMultiplicadora,
      ativar: (id) => ativarM.mutate(id),
      desativar: (id) => desativarM.mutate(id),
      adicionarRodas: (r, onSuccess) => importarM.mutate(r, { onSuccess }),
      atualizarRoda: (id, dados, onSuccess) => atualizarRodaM.mutate({ id, dados }, { onSuccess }),
    }}>
      {children}
    </MultiplicadoresContext>
  )
}

// ── Public provider — picks mode automatically ────────────────────────────────
export function MultiplicadoresProvider({ children }: { children: React.ReactNode }) {
  if (IS_MOCK_MODE) return <MockProvider>{children}</MockProvider>
  return <ApiProvider>{children}</ApiProvider>
}

export function useMultiplicadores() {
  const ctx = useContext(MultiplicadoresContext)
  if (!ctx) throw new Error('useMultiplicadores must be used inside MultiplicadoresProvider')
  return ctx
}
