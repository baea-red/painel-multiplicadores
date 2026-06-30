'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { KpiCard } from './kpi-card'
import { BarChartMunicipios } from './bar-chart-municipios'
import { MultiplicadoraDrawer } from './multiplicadora-drawer'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'
import type { Multiplicador } from '@/lib/types'

export function DashboardCoordenacao() {
  const router = useRouter()
  const { multiplicadores, rodas } = useMultiplicadores()
  const { usuario } = usePerfil()
  const [drawer, setDrawer] = useState<Multiplicador | null>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)
  function showToast(msg: string, tipo: 'ok' | 'erro' = 'ok') {
    setToast({ msg, tipo }); setTimeout(() => setToast(null), 5000)
  }

  const coordenador = coordenadores.find(c => c.id === usuario?.coordenadorId)
  const estadosCoordenador = coordenador?.estados ?? []

  const multsDaRegiao = estadosCoordenador.length > 0
    ? multiplicadores.filter(m => estadosCoordenador.includes(m.estado))
    : multiplicadores

  const rodasDaRegiao = estadosCoordenador.length > 0
    ? rodas.filter(r => estadosCoordenador.includes(r.estado))
    : rodas

  const ultimaRodaPorMult = useMemo(() => rodasDaRegiao.reduce((map, r) => {
    const atual = map.get(r.multiplicadoraId)
    if (!atual || r.dataInicio > atual) map.set(r.multiplicadoraId, r.dataInicio)
    return map
  }, new Map<string, string>()), [rodasDaRegiao])

  const rodasPorMunicipio = Array.from(
    rodasDaRegiao.reduce((map, r) => {
      map.set(r.municipio, (map.get(r.municipio) ?? 0) + 1)
      return map
    }, new Map<string, number>())
  ).map(([municipio, total]) => ({ municipio, total }))

  const formadas = multsDaRegiao.filter(m => m.status === 'formado').length
  const emFormacao = multsDaRegiao.filter(m => m.status === 'em_formacao').length
  const inativas = multsDaRegiao.filter(m => m.status === 'inativo').length
  const totalMult = multsDaRegiao.length

  const regiaoLabel = coordenador
    ? `${coordenador.regiao} / ${coordenador.estados.join(', ')}`
    : 'Coordenação Regional'

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dashboard Regional</p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold">Coordenação — {regiaoLabel}</h1>
        </div>
        <button onClick={() => router.push('/relatorios')} aria-label="Ver relatórios" className="self-start flex items-center gap-2 text-sm font-medium text-white rounded-full px-4 py-2" style={{ background: '#E91E8C' }}>
          <span aria-hidden="true">📊</span> Relatórios
        </button>
      </div>

      {/* KPIs — 2 col mobile, 3 tablet, 5 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard label="Multiplicadores Ativas" valor={emFormacao} icon="👩" cor="rosa" />
        <KpiCard label="Formadas" valor={formadas} icon="🏅" cor="verde" />
        <KpiCard label="Rodas Realizadas" valor={rodasDaRegiao.length} icon="🎯" cor="rosa" />
        <KpiCard label="Pessoas Impactadas" valor={rodasDaRegiao.reduce((s, r) => s + r.participantes, 0)} icon="👥" cor="azul" />
        <KpiCard label="Municípios Atendidos" valor={new Set(multsDaRegiao.map(m => m.municipio)).size} icon="📍" cor="laranja" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
          <h2 className="font-heading font-semibold text-base mb-4">Rodas por Município</h2>
          <BarChartMunicipios data={rodasPorMunicipio} />
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
          <h2 className="font-heading font-semibold text-base mb-4">Status das Multiplicadores</h2>
          <div className="space-y-3 mt-4">
            {[
              { label: 'Formadas', count: formadas, cor: '#E91E8C' },
              { label: 'Em Formação', count: emFormacao, cor: '#7B1FA2' },
              { label: 'Inativas', count: inativas, cor: '#D0D0D0' },
            ].map(({ label, count, cor }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cor }} />
                    <span className="text-gray-600">{label}</span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {totalMult > 0 ? Math.round((count / totalMult) * 100) : 0}%
                  </span>
                </div>
                <div
                  className="h-2 bg-gray-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label={label}
                  aria-valuenow={totalMult > 0 ? Math.round((count / totalMult) * 100) : 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full" style={{ width: `${totalMult > 0 ? Math.round((count / totalMult) * 100) : 0}%`, backgroundColor: cor }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela — scroll horizontal no mobile */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-base">Multiplicadores da Região</h2>
        </div>
        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {multsDaRegiao.map(m => (
            <div key={m.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{m.nome}</p>
                <p className="text-xs text-gray-400">{m.municipio}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${m.status === 'formado' ? 'bg-green-100 text-green-700' : m.status === 'em_formacao' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.status === 'formado' ? 'Formado' : m.status === 'em_formacao' ? 'Em Prática' : 'Aguardando'}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: '#E91E8C' }}>{m.rodasRealizadas} rodas</span>
                </div>
              </div>
              <button onClick={() => setDrawer(m)} aria-label={`Ver detalhes de ${m.nome}`} className="text-xs font-medium border rounded-full px-3 py-1.5 hover:bg-pink-50 transition-colors shrink-0" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>Ver</button>
            </div>
          ))}
        </div>
        {/* Desktop: tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Nome', 'Município', 'Status', 'Rodas', 'Última Atividade', 'Ações'].map(h => (
                  <th key={h} className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {multsDaRegiao.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                        {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <span className="font-medium truncate">{m.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-gray-500">{m.municipio}</td>
                  <td className="px-4 sm:px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${m.status === 'formado' ? 'bg-green-100 text-green-700' : m.status === 'em_formacao' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.status === 'formado' ? 'Formado' : m.status === 'em_formacao' ? 'Em Prática' : 'Aguardando'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-3 font-semibold" style={{ color: '#E91E8C' }}>{m.rodasRealizadas}</td>
                  <td className="px-4 sm:px-5 py-3 text-gray-500 whitespace-nowrap">
                    {ultimaRodaPorMult.has(m.id)
                      ? new Date(ultimaRodaPorMult.get(m.id)!).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td className="px-4 sm:px-5 py-3">
                    <button onClick={() => setDrawer(m)} aria-label={`Ver detalhes de ${m.nome}`} className="text-xs font-medium border rounded-full px-3 py-1 hover:bg-pink-50 transition-colors" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MultiplicadoraDrawer mult={drawer} onClose={() => setDrawer(null)} onToast={showToast} />

      {toast && (
        <div role="alert" aria-live="assertive"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-2"
          style={{ background: toast.tipo === 'ok' ? '#2E7D32' : '#D32F2F' }}
        >
          {toast.tipo === 'ok' ? '✓' : '✕'} {toast.msg}
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
