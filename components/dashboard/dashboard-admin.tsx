'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KpiCard } from './kpi-card'
import { BarChartMunicipios } from './bar-chart-municipios'
import { DonutChart } from './donut-chart'
import { BairrosTable } from './bairros-table'
import { MultiplicadoraDrawer } from './multiplicadora-drawer'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { usePagination } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/ui/pagination'
import type { Multiplicador } from '@/lib/types'

export function DashboardAdmin() {
  const { multiplicadores, rodas } = useMultiplicadores()
  const { usuario } = usePerfil()
  const podeAprovar = usuario?.perfil === 'administrador' || usuario?.perfil === 'coordenador'
  const pendentes = multiplicadores.filter(m => m.status === 'aguardando_validacao').length
  const [drawerMult, setDrawerMult] = useState<Multiplicador | null>(null)
  const { paginated: multPaginados, page: multPage, pageSize: multPageSize, totalPages: multTotalPages, total: multTotal, changePage: multChangePage, changePageSize: multChangePageSize } = usePagination(multiplicadores)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)
  function showToast(msg: string, tipo: 'ok' | 'erro' = 'ok') {
    setToast({ msg, tipo }); setTimeout(() => setToast(null), 5000)
  }

  const kpisNacional = {
    totalMultiplicadores: multiplicadores.length,
    emFormacaoPratica: multiplicadores.filter(m => m.status === 'em_formacao').length,
    aguardandoValidacao: multiplicadores.filter(m => m.status === 'aguardando_validacao').length,
    formadas: multiplicadores.filter(m => m.status === 'formado').length,
    rodasRealizadas: rodas.length,
    pessoasImpactadas: rodas.reduce((s, r) => s + r.participantes, 0),
    estadosAtendidos: new Set(multiplicadores.map(m => m.estado)).size,
    municipiosAtendidos: new Set(multiplicadores.map(m => m.municipio)).size,
  }

  const total = kpisNacional.totalMultiplicadores || 1
  const pct = (n: number) => Math.round((n / total) * 100)

  const rodasPorEstado = Object.entries(
    rodas.reduce((acc: Record<string, number>, r) => { acc[r.estado] = (acc[r.estado] ?? 0) + 1; return acc }, {})
  ).map(([municipio, t]) => ({ municipio, total: t })).sort((a, b) => b.total - a.total).slice(0, 5)

  const statusData = [
    { name: 'Formados', value: pct(kpisNacional.formadas), cor: '#E91E8C' },
    { name: 'Em Formação', value: pct(kpisNacional.emFormacaoPratica), cor: '#7B1FA2' },
    { name: 'Aguard. Validação', value: pct(kpisNacional.aguardandoValidacao), cor: '#5E35B1' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dashboard Nacional</p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold">Visão Geral da Plataforma</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/multiplicadoras" aria-label="Ver gestão de multiplicadores" className="flex items-center gap-2 text-sm font-medium border border-gray-200 rounded-full px-4 py-2 hover:bg-muted transition-colors bg-white">
            <span aria-hidden="true">👩</span> Multiplicadores
          </Link>
          {pendentes > 0 && (
            <Link href="/admin/validacao" aria-label={`Validar ${pendentes} multiplicadores pendentes`} className="flex items-center gap-2 text-sm font-medium text-white rounded-full px-4 py-2" style={{ background: '#2E7D32' }}>
              ✅ Validar ({pendentes})
            </Link>
          )}
        </div>
      </div>

      {/* KPIs — 2 col mobile, 4 desktop, distribuição uniforme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Multiplicadores" valor={kpisNacional.totalMultiplicadores} icon="👩" cor="rosa" />
        <KpiCard label="Em Formação Prática" valor={kpisNacional.emFormacaoPratica} icon="📚" cor="roxo" />
        <KpiCard label="Aguardando Validação" valor={kpisNacional.aguardandoValidacao} icon="⏳" cor="laranja" />
        <KpiCard label="Formadas" valor={kpisNacional.formadas} icon="🏅" cor="verde" />
        <KpiCard label="Rodas Realizadas" valor={kpisNacional.rodasRealizadas} icon="🎯" cor="rosa" />
        <KpiCard label="Pessoas Impactadas" valor={kpisNacional.pessoasImpactadas} icon="👥" cor="azul" />
        <KpiCard label="Estados Atendidos" valor={kpisNacional.estadosAtendidos} icon="🗺️" cor="roxo" />
        <KpiCard label="Municípios Atendidos" valor={kpisNacional.municipiosAtendidos} icon="📍" cor="laranja" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col min-h-[220px]">
          <h2 className="font-heading font-semibold text-base mb-5">Rodas por Estado</h2>
          <div className="flex-1 flex flex-col justify-center">
            <BarChartMunicipios data={rodasPorEstado} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col min-h-[220px]">
          <h2 className="font-heading font-semibold text-base mb-5">Distribuição por Status</h2>
          <div className="flex-1 flex items-center gap-6 sm:gap-8">
            <DonutChart data={statusData} size={140} />
            <div className="flex-1 space-y-4">
              {statusData.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.cor }} />
                    <span className="text-gray-600 text-sm">{d.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bairros */}
      <BairrosTable />

      {/* Tabela multiplicadores — scroll horizontal no mobile */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-base">Multiplicadores Cadastradas</h2>
          <Link href="/admin/multiplicadoras" className="text-xs font-medium border rounded-full px-3 py-1 hover:bg-pink-50 transition-colors" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>
            Ver Gestão Completa
          </Link>
        </div>
        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {multPaginados.map(m => (
            <div key={m.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{m.nome}</p>
                <p className="text-xs text-gray-400">{m.municipio} · {m.estado}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${m.status === 'formado' ? 'bg-green-100 text-green-700' : m.status === 'em_formacao' ? 'bg-blue-100 text-blue-700' : m.status === 'aguardando_validacao' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.status === 'formado' ? 'Formado' : m.status === 'em_formacao' ? 'Em Prática' : m.status === 'aguardando_validacao' ? 'Aguardando' : m.status === 'inativo' ? 'Inativo' : m.status}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: '#E91E8C' }}>{m.rodasRealizadas} rodas</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => setDrawerMult(m)} aria-label={`Ver detalhes de ${m.nome}`} className="text-xs font-medium border rounded-full px-3 py-1 hover:bg-pink-50 transition-colors" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>Ver</button>
                {m.status === 'aguardando_validacao' && podeAprovar && (
                  <button onClick={() => setDrawerMult(m)} aria-label={`Validar ${m.nome}`} className="text-xs font-semibold text-white rounded-full px-3 py-1 hover:opacity-90" style={{ background: '#2E7D32' }}>Validar</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Desktop: tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Nome', 'Estado', 'Município', 'Status', 'Rodas', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="px-4 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {multPaginados.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                        {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{m.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-gray-500">{m.estado}</td>
                  <td className="px-4 sm:px-5 py-3 text-gray-500">{m.municipio}</td>
                  <td className="px-4 sm:px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${m.status === 'formado' ? 'bg-green-100 text-green-700' : m.status === 'em_formacao' ? 'bg-blue-100 text-blue-700' : m.status === 'aguardando_validacao' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.status === 'formado' ? 'Formado' : m.status === 'em_formacao' ? 'Em Prática' : m.status === 'aguardando_validacao' ? 'Aguardando' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-3 font-semibold" style={{ color: '#E91E8C' }}>{m.rodasRealizadas}</td>
                  <td className="px-4 sm:px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(m.dataIngresso).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 sm:px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setDrawerMult(m)} aria-label={`Ver detalhes de ${m.nome}`} className="text-xs font-medium border rounded-full px-2 py-0.5 hover:bg-pink-50 transition-colors" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>Ver</button>
                      {m.status === 'aguardando_validacao' && podeAprovar && (
                        <button onClick={() => setDrawerMult(m)} aria-label={`Validar ${m.nome}`} className="flex items-center gap-1 text-xs font-semibold text-white rounded-full px-2.5 py-1 hover:opacity-90" style={{ background: '#2E7D32' }}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Validar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={multPage} totalPages={multTotalPages} total={multTotal} pageSize={multPageSize} onPage={multChangePage} onPageSize={multChangePageSize} />
      </div>

      <MultiplicadoraDrawer mult={drawerMult} onClose={() => setDrawerMult(null)} onToast={showToast} />
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
