'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePagination, PAGE_SIZE_OPTIONS } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/ui/pagination'

type SortCol = 'rodas' | 'ativas' | 'mults' | 'participantes'

const COL_LABELS: Record<SortCol, string> = {
  rodas: 'Rodas', ativas: 'Ativas', mults: 'Multiplicadores', participantes: 'Participantes',
}

export default function BairrosAtendidosPage() {
  const router = useRouter()
  const { rodas, multiplicadores } = useMultiplicadores()

  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMunicipio, setFiltroMunicipio] = useState('')
  const [filtroBairro, setFiltroBairro] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('rodas')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const linhas = useMemo(() => {
    const map = new Map<string, { estado: string; municipio: string; bairro: string; rodas: number; ativas: number; mults: number; participantes: number }>()
    for (const r of rodas) {
      const key = `${r.estado}||${r.municipio}||${r.bairro}`
      const existing = map.get(key)
      const m = multiplicadores.filter(m => m.municipio === r.municipio && m.bairro === r.bairro).length
      if (existing) {
        existing.rodas++
        if (r.status === 'ativa') existing.ativas++
        existing.participantes += r.participantes
        existing.mults = m
      } else {
        map.set(key, {
          estado: r.estado, municipio: r.municipio, bairro: r.bairro,
          rodas: 1, ativas: r.status === 'ativa' ? 1 : 0,
          mults: m, participantes: r.participantes,
        })
      }
    }
    return Array.from(map.values())
  }, [rodas, multiplicadores])

  const estados = [...new Set(linhas.map(l => l.estado))].sort()
  const municipios = [...new Set(linhas.filter(l => !filtroEstado || l.estado === filtroEstado).map(l => l.municipio))].sort()

  const filtradas = linhas
    .filter(l =>
      (!filtroEstado || l.estado === filtroEstado) &&
      (!filtroMunicipio || l.municipio === filtroMunicipio) &&
      (!filtroBairro || l.bairro.toLowerCase().includes(filtroBairro.toLowerCase()))
    )
    .sort((a, b) => sortDir === 'desc' ? b[sortCol] - a[sortCol] : a[sortCol] - b[sortCol])

  const { paginated, page, pageSize, totalPages, total, changePage, changePageSize } = usePagination(filtradas)

  const temFiltro = filtroEstado || filtroMunicipio || filtroBairro

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Bairros Atendidos</h1>
        <p className="text-sm text-muted-foreground">{filtradas.length} bairro{filtradas.length !== 1 ? 's' : ''} encontrado{filtradas.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Estado</label>
            <select
              value={filtroEstado}
              onChange={e => { setFiltroEstado(e.target.value); setFiltroMunicipio(''); changePage(1) }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos os estados</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Município</label>
            <select
              value={filtroMunicipio}
              onChange={e => { setFiltroMunicipio(e.target.value); changePage(1) }}
              disabled={!filtroEstado}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Todos os municípios</option>
              {municipios.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Bairro</label>
            <input
              type="text"
              placeholder="Buscar bairro..."
              value={filtroBairro}
              onChange={e => { setFiltroBairro(e.target.value); changePage(1) }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        {temFiltro && (
          <div className="flex justify-end">
            <button
              onClick={() => { setFiltroEstado(''); setFiltroMunicipio(''); setFiltroBairro(''); changePage(1) }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {paginated.length === 0 ? (
            <p className="px-5 py-10 text-center text-gray-400 text-sm">Nenhum bairro encontrado</p>
          ) : paginated.map((l, i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' }}>
                {l.bairro.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{l.bairro}</p>
                <p className="text-xs text-gray-400">{l.municipio} · {l.estado}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: '#E91E8C' }}>{l.rodas} rodas</span>
                  {l.ativas > 0 && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{l.ativas} ativa{l.ativas !== 1 ? 's' : ''}</span>}
                  <span className="text-xs text-gray-400">{l.participantes} part.</span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/admin/bairros?estado=${encodeURIComponent(l.estado)}&municipio=${encodeURIComponent(l.municipio)}&bairro=${encodeURIComponent(l.bairro)}`)}
                className="text-xs font-medium border rounded-full px-3 py-1.5 hover:bg-pink-50 transition-colors shrink-0"
                style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
              >
                Ver rodas
              </button>
            </div>
          ))}
        </div>

        {/* Desktop: tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Município</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Bairro</th>
                {(['rodas', 'ativas', 'mults', 'participantes'] as const).map(col => {
                  const active = sortCol === col
                  return (
                    <th key={col} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      <button
                        onClick={() => toggleSort(col)}
                        className={`flex items-center gap-1 transition-colors hover:text-primary ${active ? 'text-primary' : 'text-gray-400'}`}
                      >
                        {COL_LABELS[col]}
                        <span className="flex flex-col leading-none ml-0.5">
                          <svg className={`w-2.5 h-2.5 transition-opacity ${active && sortDir === 'asc' ? 'opacity-100' : 'opacity-30'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0L5 0z" /></svg>
                          <svg className={`w-2.5 h-2.5 transition-opacity ${active && sortDir === 'desc' ? 'opacity-100' : 'opacity-30'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10L5 6z" /></svg>
                        </span>
                      </button>
                    </th>
                  )
                })}
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">Nenhum bairro encontrado</td></tr>
              ) : paginated.map((l, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">{l.estado}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">{l.municipio}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#E91E8C' }} />
                      <span className="text-gray-700">{l.bairro}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold" style={{ color: '#E91E8C' }}>{l.rodas}</td>
                  <td className="px-5 py-3">
                    {l.ativas > 0
                      ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{l.ativas} ativa{l.ativas !== 1 ? 's' : ''}</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-5 py-3 font-semibold" style={{ color: '#7B1FA2' }}>{l.mults}</td>
                  <td className="px-5 py-3 text-gray-500">{l.participantes}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => router.push(`/admin/bairros?estado=${encodeURIComponent(l.estado)}&municipio=${encodeURIComponent(l.municipio)}&bairro=${encodeURIComponent(l.bairro)}`)}
                      className="text-xs font-medium border rounded-full px-3 py-1 hover:bg-pink-50 transition-colors whitespace-nowrap"
                      style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
                    >
                      Ver rodas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totalizador + Paginação */}
        {filtradas.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between text-xs text-gray-500">
            <div className="flex gap-4 flex-wrap">
              <span>Total: <strong className="text-gray-800">{filtradas.reduce((s, l) => s + l.rodas, 0)}</strong> rodas</span>
              <span><strong className="text-green-600">{filtradas.reduce((s, l) => s + l.ativas, 0)}</strong> ativas</span>
              <span><strong style={{ color: '#7B1FA2' }}>{filtradas.reduce((s, l) => s + l.mults, 0)}</strong> multiplicadores</span>
              <span><strong className="text-gray-800">{filtradas.reduce((s, l) => s + l.participantes, 0)}</strong> participantes</span>
            </div>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPage={changePage}
          onPageSize={changePageSize}
        />
      </div>
    </div>
  )
}
