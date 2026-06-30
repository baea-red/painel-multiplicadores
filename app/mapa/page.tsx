'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'

const MapaBrasil = dynamic(
  () => import('@/components/mapa/mapa-brasil').then(m => m.MapaBrasil),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-[#D4E9F7]"><div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" /></div> }
)

function initials(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('')
}

export default function MapaPage() {
  const { multiplicadores, rodas } = useMultiplicadores()
  const [estado, setEstado] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [drawer, setDrawer] = useState<{ cidade: string; estado: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [focusBusca, setFocusBusca] = useState<{ estado: string; municipio: string } | null>(null)

  function handleBuscar() {
    setFocusBusca({ estado, municipio })
    setSidebarOpen(false)
  }

  const rodasConcluidas = rodas.filter(r => r.status === 'concluida')

  const cidades = useMemo(() => {
    const map = new Map<string, { estado: string; ids: string[] }>()
    multiplicadores.forEach(m => {
      const key = m.municipio
      const entry = map.get(key) ?? { estado: m.estado, ids: [] }
      entry.ids.push(m.id)
      map.set(key, entry)
    })
    return Array.from(map.entries()).map(([cidade, { estado: est, ids }]) => ({
      cidade,
      estado: est,
      mult: ids.length,
      status: ids.some(id => multiplicadores.find(m => m.id === id)?.status === 'em_formacao' || multiplicadores.find(m => m.id === id)?.status === 'aguardando_validacao') ? 'ativo' : 'concluido',
    }))
  }, [multiplicadores])

  const estadosMunicipios = useMemo(() => {
    const map: Record<string, string[]> = {}
    multiplicadores.forEach(m => {
      if (!map[m.estado]) map[m.estado] = []
      if (!map[m.estado].includes(m.municipio)) map[m.estado].push(m.municipio)
    })
    return map
  }, [multiplicadores])

  const multiplicadorasPorCidade = useMemo(() => {
    const map: Record<string, { nome: string; rodas: number; certificada: string }[]> = {}
    multiplicadores.forEach(m => {
      const rodasMult = rodasConcluidas.filter(r => r.multiplicadoraId === m.id).length
      const entry = {
        nome: m.nome,
        rodas: rodasMult,
        certificada: m.dataConclusao
          ? new Date(m.dataConclusao).toLocaleDateString('pt-BR')
          : m.status === 'formado' ? '—' : 'Em formação',
      }
      if (!map[m.municipio]) map[m.municipio] = []
      map[m.municipio].push(entry)
    })
    return map
  }, [multiplicadores, rodasConcluidas])

  const stats = useMemo(() => [
    { label: 'Multiplicadoras', valor: String(multiplicadores.length), cor: '#E91E8C' },
    { label: 'Municípios', valor: String(new Set(rodasConcluidas.map(r => r.municipio)).size), cor: '#7B1FA2' },
    { label: 'Estados', valor: String(new Set(multiplicadores.map(m => m.estado)).size), cor: '#1565C0' },
    { label: 'Rodas', valor: String(rodasConcluidas.length), cor: '#E65100' },
  ], [multiplicadores, rodasConcluidas])

  const municipiosFiltrados = estado ? estadosMunicipios[estado] ?? [] : []

  function handleEstado(e: React.ChangeEvent<HTMLSelectElement>) {
    setEstado(e.target.value)
    setMunicipio('')
  }

  const cidadesFiltradas = estado
    ? cidades.filter(c => c.estado === estado && (!municipio || c.cidade === municipio))
    : cidades

  const drawerMults = drawer ? (multiplicadorasPorCidade[drawer.cidade] ?? []) : []

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20"
        style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}>
        <Link href="/" className="text-white font-heading font-bold text-sm sm:text-base">Grupo Mulheres do Brasil</Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar-filtros"
            className="md:hidden p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <Link href="/" className="text-white/70 text-sm hover:text-white hidden sm:inline">Página Inicial</Link>
          <Link href="/entrar" className="bg-white text-primary font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-white/90">Entrar</Link>
        </div>
      </header>

      {/* Corpo */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Overlay backdrop on mobile when sidebar open */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside id="sidebar-filtros" role="complementary" className={`
          fixed md:static inset-y-0 left-0 z-30
          w-72 md:w-64 lg:w-72
          bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b border-gray-100">
            <h1 className="font-heading font-bold text-base text-gray-800">Mapa de Multiplicadores</h1>
            <p className="text-xs text-gray-400 mt-0.5">Grupo Mulheres do Brasil</p>
          </div>

          <dl className="grid grid-cols-2 gap-2 p-4 border-b border-gray-100">
            {stats.map(({ label, valor, cor }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <dd className="text-xl font-heading font-bold" style={{ color: cor }}>{valor}</dd>
                <dt className="text-[10px] text-gray-400 mt-0.5">{label}</dt>
              </div>
            ))}
          </dl>

          <div className="p-4 border-b border-gray-100 space-y-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Estado</label>
              <select value={estado} onChange={handleEstado}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="">Todos</option>
                {Object.keys(estadosMunicipios).map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Município</label>
              <select value={municipio} onChange={e => setMunicipio(e.target.value)} disabled={!estado}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                <option value="">Todos</option>
                {municipiosFiltrados.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Legenda</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#E91E8C' }} />Em formação</div>
              <div className="flex items-center gap-2 text-sm text-gray-600"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: '#7B1FA2' }} />Formada</div>
            </div>
          </div>

          {/* Lista — clicável */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Cidades <span className="normal-case font-normal text-gray-300">· clique para ver multiplicadores</span>
            </p>
            {cidadesFiltradas.map(p => (
              <button
                key={p.cidade}
                onClick={() => setDrawer({ cidade: p.cidade, estado: p.estado })}
                className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-pink-50 transition-colors text-left group ${
                  drawer?.cidade === p.cidade ? 'bg-pink-50 ring-1 ring-primary/20' : ''
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.status === 'ativo' ? '#E91E8C' : '#7B1FA2' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">{p.cidade}</p>
                  <p className="text-xs text-gray-400">{p.estado} · {p.mult} multiplicadora{p.mult > 1 ? 's' : ''}</p>
                </div>
                <span className="text-gray-300 group-hover:text-primary text-xs transition-colors">›</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 shrink-0">
            <button
              onClick={handleBuscar}
              className="w-full flex items-center justify-center text-sm font-semibold text-white rounded-xl py-2.5 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
            >
              Buscar
            </button>
          </div>
        </aside>

        {/* Mapa */}
        <div className="flex-1 relative overflow-hidden min-w-0">
          <MapaBrasil
            focusEstado={focusBusca?.estado ?? ''}
            focusMunicipio={focusBusca?.municipio ?? ''}
            onCidadeClick={(cidade, est) => setDrawer({ cidade, estado: est })}
          />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md text-xs font-medium text-gray-600 pointer-events-none whitespace-nowrap z-10">
            👆 Clique nos marcadores ou nas cidades para ver as multiplicadores
          </div>
        </div>

        {/* Drawer lateral direito */}
        <div aria-live="polite" className={`bg-white border-l border-gray-200 shadow-2xl flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          drawer ? 'w-full sm:w-80 md:w-96' : 'w-0'
        }`}>
          <div className="w-full sm:w-80 md:w-96 h-full flex flex-col">
            {/* Header do drawer */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0"
              style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}>
              <div>
                <h2 className="font-heading font-bold text-white text-base">{drawer?.cidade}</h2>
                <p className="text-white/70 text-xs mt-0.5">{drawer?.estado} · {drawerMults.length} multiplicadora{drawerMults.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setDrawer(null)} aria-label="Fechar painel"
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cards das multiplicadores */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawerMults.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">Nenhuma multiplicadora cadastrada nesta cidade.</p>
              ) : (
                drawerMults.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/30 transition-colors">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
                    >
                      {initials(m.nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{m.nome}</p>
                      <p className="text-xs text-gray-400">{drawer?.cidade} · {drawer?.estado}</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: '#E91E8C' }}>
                        {m.rodas} rodas · {m.certificada === 'Em formação' ? 'Em formação' : `Certificada ${m.certificada}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
