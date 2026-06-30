'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, ChevronRight } from 'lucide-react'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'

export function VisaoMunicipios() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { multiplicadores, rodas } = useMultiplicadores()
  const { usuario } = usePerfil()

  const coordenador = usuario?.perfil === 'coordenador'
    ? coordenadores.find(c => c.id === usuario.coordenadorId)
    : null
  const rodasBase = coordenador
    ? rodas.filter(r => coordenador.estados.includes(r.estado))
    : rodas
  const multiBase = coordenador
    ? multiplicadores.filter(m => coordenador.estados.includes(m.estado))
    : multiplicadores

  const [filtroEstado, setFiltroEstado] = useState(searchParams.get('filtroEstado') ?? '')
  const [filtroMunicipio, setFiltroMunicipio] = useState(searchParams.get('filtroMunicipio') ?? '')

  // Restore filters from URL on mount
  useEffect(() => {
    setFiltroEstado(searchParams.get('filtroEstado') ?? '')
    setFiltroMunicipio(searchParams.get('filtroMunicipio') ?? '')
  }, [searchParams])

  const estadosMap = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, typeof rodasBase>>>()
    for (const r of rodasBase) {
      if (!map.has(r.estado)) map.set(r.estado, new Map())
      const munMap = map.get(r.estado)!
      if (!munMap.has(r.municipio)) munMap.set(r.municipio, new Map())
      const bairros = munMap.get(r.municipio)!
      if (!bairros.has(r.bairro)) bairros.set(r.bairro, [])
      bairros.get(r.bairro)!.push(r)
    }
    return map
  }, [rodasBase])

  const estadosList = useMemo(() => {
    return Array.from(estadosMap.entries())
      .map(([estado, munMap]) => {
        const municipios = Array.from(munMap.entries())
          .map(([municipio, bairrosMap]) => {
            const todasRodas = Array.from(bairrosMap.values()).flat()
            const mults = multiBase.filter(m => m.municipio === municipio && m.estado === estado)
            const participantes = todasRodas.reduce((s, r) => s + r.participantes, 0)
            return { municipio, bairros: bairrosMap.size, totalRodas: todasRodas.length, totalMults: mults.length, participantes }
          })
          .filter(d => !filtroMunicipio || d.municipio === filtroMunicipio)
          .sort((a, b) => b.totalRodas - a.totalRodas)
        const totalRodas = municipios.reduce((s, m) => s + m.totalRodas, 0)
        const totalMults = multiBase.filter(m => m.estado === estado).length
        const participantes = municipios.reduce((s, m) => s + m.participantes, 0)
        return { estado, municipios, totalRodas, totalMults, participantes, totalMunicipios: munMap.size }
      })
      .filter(e => e.municipios.length > 0)
      .filter(e => !filtroEstado || e.estado === filtroEstado)
      .sort((a, b) => b.totalRodas - a.totalRodas)
  }, [estadosMap, filtroEstado, filtroMunicipio, multiBase])

  const totais = useMemo(() => ({
    municipios: Array.from(estadosMap.values()).reduce((s, m) => s + m.size, 0),
    rodas: rodasBase.length,
    mults: multiBase.length,
    participantes: rodasBase.reduce((s, r) => s + r.participantes, 0),
  }), [estadosMap, rodasBase, multiBase])

  function navegar(estado: string, municipio: string) {
    const params = new URLSearchParams()
    if (filtroEstado) params.set('filtroEstado', filtroEstado)
    if (filtroMunicipio) params.set('filtroMunicipio', filtroMunicipio)
    router.push(`/municipios/${encodeURIComponent(estado)}/${encodeURIComponent(municipio)}${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Municípios', val: totais.municipios, cor: '#E91E8C' },
          { label: 'Rodas', val: totais.rodas, cor: '#7B1FA2' },
          { label: 'Multiplicadores', val: totais.mults, cor: '#1565C0' },
          { label: 'Participantes', val: totais.participantes, cor: '#2E7D32' },
        ].map(({ label, val, cor }) => (
          <div key={label} className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4">
            <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: cor }} />
            <div>
              <p className="text-3xl sm:text-4xl font-heading font-bold leading-none" style={{ color: cor }}>{val}</p>
              <p className="text-sm text-gray-400 mt-1 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 bg-white rounded-2xl shadow-sm p-3">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">Estado</label>
          <select
            value={filtroEstado}
            onChange={e => { setFiltroEstado(e.target.value); setFiltroMunicipio('') }}
            className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="">Todos</option>
            {Array.from(estadosMap.keys()).sort().map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
        <div className="w-px bg-gray-100 self-stretch" />
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">Município</label>
          <select
            value={filtroMunicipio}
            onChange={e => setFiltroMunicipio(e.target.value)}
            disabled={!filtroEstado}
            className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Todos</option>
            {filtroEstado && Array.from(estadosMap.get(filtroEstado)?.keys() ?? []).sort().map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {estadosList.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm shadow-sm">
          Nenhum município encontrado.
        </div>
      )}

      {/* Agrupado por estado */}
      <div className="space-y-5">
        {estadosList.map(({ estado, municipios, totalRodas: estRodas, totalMults: estMults, participantes: estPart, totalMunicipios }) => (
          <div key={estado}>
            {/* Header do estado */}
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' }}>
                {estado}
              </div>
              <p className="font-heading font-bold text-gray-700 text-base flex-1">
                {estado === 'CE' ? 'Ceará' : estado === 'SP' ? 'São Paulo' : estado === 'BA' ? 'Bahia' : estado === 'RJ' ? 'Rio de Janeiro' : estado === 'MG' ? 'Minas Gerais' : estado}
              </p>
              <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
                <span><strong className="text-gray-600">{totalMunicipios}</strong> municípios</span>
                <span><strong className="text-gray-600">{estRodas}</strong> rodas</span>
                <span><strong className="text-gray-600">{estMults}</strong> mult.</span>
                <span><strong className="text-gray-600">{estPart}</strong> part.</span>
              </div>
            </div>

            {/* Lista de municípios — clicáveis */}
            <div className="space-y-2">
              {municipios.map(({ municipio, bairros, totalRodas, totalMults, participantes }) => (
                <button
                  key={municipio}
                  onClick={() => navegar(estado, municipio)}
                  className="w-full bg-white rounded-2xl shadow-sm px-4 sm:px-5 py-4 flex items-center gap-3 hover:shadow-md hover:bg-gray-50/40 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 group-hover:bg-pink-50 transition-colors">
                    <MapPin className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-lg sm:text-xl text-gray-900">{municipio}</p>
                    <p className="text-sm text-gray-400">{bairros} bairro{bairros !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex items-center gap-5 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E91E8C' }} />
                        <strong className="text-gray-700">{totalRodas}</strong> rodas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7B1FA2' }} />
                        <strong className="text-gray-700">{totalMults}</strong> mult.
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <strong className="text-gray-700">{participantes}</strong> part.
                      </span>
                    </div>
                    {/* Mobile */}
                    <div className="flex sm:hidden items-center gap-3 text-sm font-bold">
                      <span style={{ color: '#E91E8C' }}>{totalRodas}r</span>
                      <span style={{ color: '#7B1FA2' }}>{totalMults}m</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-pink-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
