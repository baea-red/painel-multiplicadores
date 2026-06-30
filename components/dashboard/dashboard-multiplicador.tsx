'use client'

import { useState } from 'react'
import { KpiCard } from './kpi-card'
import { DonutChart } from './donut-chart'
import { usePerfil } from '@/lib/context/perfil-context'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { NovaRodaDialog } from '@/components/rodas/nova-roda-dialog'


const CORES = ['#E91E8C', '#7B1FA2', '#5E35B1', '#AD1457', '#EC407A', '#AB47BC']


export function DashboardMultiplicador() {
  const { usuario } = usePerfil()
  const { multiplicadores, getMinimoRodas, rodas } = useMultiplicadores()
  const mult = multiplicadores.find(m => m.id === usuario?.multiplicadoraId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (!mult) return <div className="p-6 text-center text-muted-foreground">Perfil não encontrado.</div>

  const minimoRodas = getMinimoRodas(mult.estado, mult)

  const minhasRodas = rodas.filter(r => r.multiplicadoraId === mult.id)
  const rodasConcluidas = minhasRodas.filter(r => r.status === 'concluida')
  const totalParticipantes = rodasConcluidas.reduce((sum, r) => sum + r.participantes, 0)
  const rodasRealizadas = rodasConcluidas.length
  const municipiosAtendidos = new Set(rodasConcluidas.map(r => r.municipio)).size
  const pessoasImpactadas = totalParticipantes
  const municipiosMap = new Map<string, number>()
  rodasConcluidas.forEach(r => municipiosMap.set(r.municipio, (municipiosMap.get(r.municipio) ?? 0) + r.participantes))

  const emGrupo = rodasConcluidas.filter(r => r.tipo === 'em_grupo').length
  const individual = rodasConcluidas.filter(r => r.tipo === 'individual').length
  const totalTipos = emGrupo + individual
  const tipoData = totalTipos > 0
    ? [
        { name: 'Em grupo', value: Math.round((emGrupo / totalTipos) * 100), cor: '#E91E8C' },
        { name: 'Individual', value: Math.round((individual / totalTipos) * 100), cor: '#7B1FA2' },
      ]
    : [{ name: 'Sem dados', value: 100, cor: '#E0E0E0' }]
  const municipioData = totalParticipantes > 0
    ? Array.from(municipiosMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, value], i) => ({ name, value: Math.round((value / totalParticipantes) * 100), cor: CORES[i % CORES.length] }))
    : [{ name: 'Sem dados', value: 100, cor: '#E0E0E0' }]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dashboard</p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold">
            Bem-vinda, {mult.nome.split(' ')[0]} 👋
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-sm font-medium border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors bg-white">
            ↺ Atualizar
          </button>
          <button onClick={() => setDialogOpen(true)} className="flex items-center gap-2 text-sm font-medium text-white rounded-full px-4 py-2" style={{ background: '#E91E8C' }}>
            + Nova Roda
          </button>
        </div>
      </div>

      {/* KPIs — 2×2 mobile, 4 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Rodas Finalizadas" valor={rodasRealizadas} icon="🎯" cor="rosa" />
        <KpiCard label="Municípios" valor={municipiosAtendidos} icon="📍" cor="laranja" />
        <KpiCard label="Pessoas Impactadas" valor={pessoasImpactadas} icon="👥" cor="azul" />
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-40 bg-green-100" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Status Atual</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mt-1 ${
              mult.status === 'formado' ? 'bg-green-100 text-green-700' :
              mult.status === 'aguardando_validacao' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {mult.status === 'formado' ? 'Formado' :
               mult.status === 'aguardando_validacao' ? 'Aguard.' : 'Em Prática'}
            </span>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="font-heading font-semibold text-base mb-3">Progresso da Formação</h2>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2 gap-2">
          <span className="text-xs sm:text-sm">{rodasRealizadas} rodas realizadas{mult.status === 'formado' ? ' — concluída! 🎉' : ''}</span>
          <span className="font-semibold shrink-0" style={{ color: '#E91E8C' }}>{rodasRealizadas}/{minimoRodas}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (rodasRealizadas / minimoRodas) * 100)}%`, background: 'linear-gradient(90deg, #E91E8C, #7B1FA2)' }}
          />
        </div>
        {mult.status === 'em_formacao' && minhasRodas.length > rodasRealizadas && (
          <p className="mt-2 text-xs text-gray-400">
            💡 Você tem {minhasRodas.length - rodasRealizadas} roda(s) em andamento. Marque-as como <strong>Registrada</strong> no detalhe para contabilizar no progresso.
          </p>
        )}
        {mult.status === 'formado' && (
          <div className="mt-3 p-3 bg-green-50 rounded-xl text-sm text-green-700">
            🏅 Formação concluída! Seu certificado está disponível.
          </div>
        )}
        {mult.status === 'aguardando_validacao' && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-xl text-sm text-yellow-700">
            ⏳ Suas rodas foram enviadas para validação.
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: 'Participantes por Município', data: municipioData },
          { title: 'Tipo de Roda', data: tipoData },
        ].map(({ title, data }) => {
          const maior = data.reduce((a, b) => a.value > b.value ? a : b)
          return (
            <div key={title} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="font-heading font-semibold text-base mb-5">{title}</h2>
              {/* Donut grande + legenda abaixo */}
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <DonutChart data={data} size={180} />
                  {/* Total no centro */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-heading font-bold text-gray-800">{maior.value}%</span>
                    <span className="text-xs text-gray-400 text-center leading-tight max-w-[60px]">{maior.name}</span>
                  </div>
                </div>
                {/* Legenda em grid 2 colunas */}
                <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {data.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.cor }} />
                        <span className="text-sm text-gray-600 truncate">{d.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800 shrink-0">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <NovaRodaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onToast={msg => { setToast(msg); setTimeout(() => setToast(null), 3500) }} />

      {toast && (
        <div role="alert" aria-live="assertive" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-2" style={{ background: '#2E7D32' }}>
          {toast}
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
