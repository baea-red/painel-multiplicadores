'use client'

import { use, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CircleDot, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { MultiplicadoraDrawer } from '@/components/dashboard/multiplicadora-drawer'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'
import type { Multiplicador } from '@/lib/types'

const statusColor: Record<string, string> = {
  ativa: 'bg-green-100 text-green-700',
  concluida: 'bg-blue-100 text-blue-700',
  pausada: 'bg-amber-100 text-amber-700',
}
const statusLabel: Record<string, string> = { ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada' }
const multStatusColor: Record<string, string> = {
  formado: 'bg-green-100 text-green-700',
  em_formacao: 'bg-blue-100 text-blue-700',
  aguardando_validacao: 'bg-yellow-100 text-yellow-700',
  inativo: 'bg-gray-100 text-gray-500',
}
const multStatusLabel: Record<string, string> = {
  formado: 'Formada', em_formacao: 'Em Formação',
  aguardando_validacao: 'Aguardando', inativo: 'Inativa',
}

export default function MunicipioDetalhePage({ params }: { params: Promise<{ estado: string; municipio: string }> }) {
  const { estado, municipio } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const estadoFiltro = searchParams.get('filtroEstado') ?? ''

  const municipioNome = decodeURIComponent(municipio)
  const estadoNome = decodeURIComponent(estado)

  const { getMinimoRodas, rodas, multiplicadores } = useMultiplicadores()
  const { usuario } = usePerfil()
  const [bairroAtivo, setBairroAtivo] = useState<string | null>(null)
  const [drawer, setDrawer] = useState<Multiplicador | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<'rodas' | 'multiplicadores'>('rodas')

  const bairros = useMemo(() => {
    const map = new Map<string, typeof rodas>()
    for (const r of rodas) {
      if (r.municipio === municipioNome && r.estado === estadoNome) {
        if (!map.has(r.bairro)) map.set(r.bairro, [])
        map.get(r.bairro)!.push(r)
      }
    }
    return Array.from(map.entries())
      .map(([bairro, rodasB]) => {
        const mults = multiplicadores.filter(m => m.municipio === municipioNome && m.bairro === bairro)
        const participantes = rodasB.reduce((s, r) => s + r.participantes, 0)
        return { bairro, rodas: rodasB, mults, participantes }
      })
      .sort((a, b) => b.rodas.length - a.rodas.length)
  }, [municipioNome, estadoNome, rodas, multiplicadores])

  const totais = useMemo(() => ({
    rodas: bairros.reduce((s, b) => s + b.rodas.length, 0),
    mults: bairros.reduce((s, b) => s + b.mults.length, 0),
    participantes: bairros.reduce((s, b) => s + b.participantes, 0),
    bairros: bairros.length,
  }), [bairros])

  const bairroData = bairroAtivo ? bairros.find(b => b.bairro === bairroAtivo) : null

  function voltar() {
    const params = new URLSearchParams()
    if (estadoFiltro) params.set('filtroEstado', estadoFiltro)
    router.push(`/municipios${params.toString() ? '?' + params.toString() : ''}`)
  }

  const coordenador = usuario?.perfil === 'coordenador'
    ? coordenadores.find(c => c.id === usuario.coordenadorId)
    : null

  if (coordenador && !coordenador.estados.includes(estadoNome)) {
    return (
      <div className="p-10 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="font-heading font-semibold text-lg text-gray-700">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground mt-1">Este estado não pertence à sua região de coordenação.</p>
        <button onClick={voltar} className="mt-4 text-sm font-medium hover:underline" style={{ color: '#E91E8C' }}>
          ← Voltar para Municípios
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Breadcrumb + voltar */}
      <div>
        <button
          onClick={voltar}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Estados e Municípios
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{estadoNome}</p>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">{municipioNome}</h1>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Bairros', val: totais.bairros, cor: '#E91E8C' },
          { label: 'Rodas', val: totais.rodas, cor: '#7B1FA2' },
          { label: 'Multiplicadores', val: totais.mults, cor: '#1565C0' },
          { label: 'Participantes', val: totais.participantes, cor: '#2E7D32' },
        ].map(({ label, val, cor }) => (
          <div key={label} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: cor }} />
            <div>
              <p className="text-2xl sm:text-3xl font-heading font-bold leading-none" style={{ color: cor }}>{val}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de bairros */}
      <div className="space-y-3">
        {bairros.map(({ bairro, rodas: rodasB, mults, participantes }) => {
          const aberto = bairroAtivo === bairro
          return (
            <div key={bairro} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header do bairro */}
              <button
                onClick={() => { setBairroAtivo(aberto ? null : bairro); setAbaAtiva('rodas') }}
                className="w-full px-4 sm:px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: aberto ? 'linear-gradient(135deg,#E91E8C,#7B1FA2)' : '#f3f4f6' }}>
                    <MapPin className="w-4 h-4" style={{ color: aberto ? 'white' : '#9ca3af' }} />
                  </div>
                  <p className="font-heading font-bold text-lg text-gray-900">{bairro}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
                    <span><strong className="text-gray-700">{rodasB.length}</strong> rodas</span>
                    <span><strong className="text-gray-700">{mults.length}</strong> mult.</span>
                    <span><strong className="text-gray-700">{participantes}</strong> part.</span>
                  </div>
                  <div className="flex sm:hidden items-center gap-3 text-sm font-bold">
                    <span style={{ color: '#E91E8C' }}>{rodasB.length}r</span>
                    <span style={{ color: '#7B1FA2' }}>{mults.length}m</span>
                  </div>
                  {aberto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Conteúdo expandido */}
              {aberto && bairroData && (
                <div className="border-t border-gray-100">
                  {/* Abas */}
                  <div className="flex border-b border-gray-100 px-4 sm:px-5">
                    {(['rodas', 'multiplicadores'] as const).map(aba => (
                      <button
                        key={aba}
                        onClick={() => setAbaAtiva(aba)}
                        className={`py-3 mr-5 text-sm font-medium border-b-2 transition-colors capitalize ${
                          abaAtiva === aba ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {aba === 'rodas' ? `Rodas (${bairroData.rodas.length})` : `Multiplicadores (${bairroData.mults.length})`}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 sm:p-5">
                    {/* Aba Rodas */}
                    {abaAtiva === 'rodas' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {bairroData.rodas.map(r => (
                          <div key={r.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-semibold text-gray-800 text-sm leading-tight">{r.nome}</p>
                              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${statusColor[r.status]}`}>
                                {statusLabel[r.status]}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{r.local} · {r.participantes} participantes</p>
                            <button
                              onClick={() => router.push(`/minhas-rodas/${r.id}`)}
                              className="w-full text-xs font-semibold py-2 rounded-xl border transition-colors hover:bg-pink-50"
                              style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
                            >
                              Ver detalhes →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Aba Multiplicadores */}
                    {abaAtiva === 'multiplicadores' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {bairroData.mults.length === 0 ? (
                          <p className="text-sm text-gray-400 italic col-span-full">Nenhuma multiplicadora neste bairro.</p>
                        ) : bairroData.mults.map(m => (
                          <div key={m.id} className="border border-gray-100 rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' }}>
                              {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">{m.nome}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((m.rodasRealizadas / getMinimoRodas(m.estado, m)) * 100))}%`, backgroundColor: '#E91E8C' }} />
                                </div>
                                <span className="text-xs text-gray-400 shrink-0">{Math.min(100, Math.round((m.rodasRealizadas / getMinimoRodas(m.estado, m)) * 100))}%</span>
                              </div>
                              <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold ${multStatusColor[m.status]}`}>
                                {multStatusLabel[m.status]}
                              </span>
                            </div>
                            <button
                              onClick={() => setDrawer(m)}
                              className="text-xs font-medium border rounded-full px-2.5 py-1 hover:bg-pink-50 transition-colors shrink-0"
                              style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
                            >
                              Ver
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {bairros.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm shadow-sm">
            Nenhum dado encontrado para {municipioNome} / {estadoNome}.
          </div>
        )}
      </div>

      <MultiplicadoraDrawer mult={drawer} onClose={() => setDrawer(null)} />
    </div>
  )
}
