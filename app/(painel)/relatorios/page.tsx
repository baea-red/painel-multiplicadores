'use client'

import { useState, useMemo, useEffect } from 'react'
import { BarChartMunicipios } from '@/components/dashboard/bar-chart-municipios'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { BairrosTable } from '@/components/dashboard/bairros-table'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'

function calcularResultados(rodas: import('@/lib/types').Roda[], estado: string, municipio: string, status: string, dataInicio: string, dataFim: string) {
  let filtered = rodas.filter(r => {
    if (estado && r.estado !== estado) return false
    if (municipio && r.municipio !== municipio) return false
    if (status && status !== 'Todos' && r.status !== status) return false
    if (dataInicio && r.dataInicio < dataInicio) return false
    if (dataFim && r.dataInicio > dataFim) return false
    return true
  })

  const totalParticipantes = filtered.reduce((s, r) => s + r.participantes, 0)
  const municipiosUnicos = [...new Set(filtered.map(r => r.municipio))]
  const multIds = [...new Set(filtered.map(r => r.multiplicadoraId))]

  const municipioData = municipiosUnicos.map(m => ({
    municipio: m,
    total: filtered.filter(r => r.municipio === m).reduce((s, r) => s + r.participantes, 0),
  })).sort((a, b) => b.total - a.total)

  return {
    rodas: filtered.length,
    participantes: totalParticipantes,
    municipios: municipiosUnicos.length,
    multiplicadoras: multIds.length,
    municipioData,
    estadoFiltro: estado,
    municipioFiltro: municipio,
  }
}

export default function RelatoriosPage() {
  const { rodas } = useMultiplicadores()
  const { usuario } = usePerfil()
  const coordenador = coordenadores.find(c => c.id === usuario?.coordenadorId)
  const regiaoLabel = coordenador
    ? `${coordenador.regiao} / ${coordenador.estados.join(', ')}`
    : 'Nacional'

  const rodasDaRegiao = useMemo(() => {
    if (!coordenador) return rodas
    return rodas.filter(r => coordenador.estados.includes(r.estado))
  }, [rodas, coordenador])

  const municipiosPorEstado = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const r of rodasDaRegiao) {
      if (!map[r.estado]) map[r.estado] = []
      if (!map[r.estado].includes(r.municipio)) map[r.estado].push(r.municipio)
    }
    return map
  }, [rodasDaRegiao])

  const [estado, setEstado] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [status, setStatus] = useState('Todos')
  const [dataInicio, setDataInicio] = useState('2024-01-01')
  const [dataFim, setDataFim] = useState('2024-12-31')
  const [resultado, setResultado] = useState(() => calcularResultados([], '', '', 'Todos', '2024-01-01', '2024-12-31'))

  useEffect(() => {
    setResultado(calcularResultados(rodasDaRegiao, '', '', 'Todos', '2024-01-01', '2024-12-31'))
  }, [rodasDaRegiao])

  const municipiosDisponiveis = municipiosPorEstado[estado] ?? []

  function gerarRelatorio() {
    setResultado(calcularResultados(rodasDaRegiao, estado, municipio, status, dataInicio, dataFim))
  }

  function exportarCSV() {
    const r = resultado
    const linhas = [
      ['Filtros', `Estado: ${estado || 'Todos'} | Município: ${municipio || 'Todos'} | Status: ${status}`],
      [],
      ['KPIs'],
      ['Rodas', r.rodas], ['Participantes', r.participantes], ['Municípios', r.municipios], ['Multiplicadores', r.multiplicadoras],
      [],
      ['Município', 'Total Participantes'],
      ...r.municipioData.map(d => [d.municipio, d.total]),
    ]
    // BOM garante que Excel abre corretamente com acentos
    const csv = '﻿' + linhas.map(row => row.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function exportarExcel() {
    const r = resultado
    const linhas = [
      ['Filtros', `Estado: ${estado || 'Todos'} | Município: ${municipio || 'Todos'} | Status: ${status}`],
      [],
      ['KPIs'],
      ['Rodas', r.rodas], ['Participantes', r.participantes], ['Municípios', r.municipios], ['Multiplicadores', r.multiplicadoras],
      [],
      ['Município', 'Total Participantes'],
      ...r.municipioData.map(d => [d.municipio, d.total]),
    ]
    const csv = '﻿' + linhas.map(row => row.join('\t')).join('\n')
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio.xls'; a.click()
    URL.revokeObjectURL(url)
  }

  function exportarPDF() {
    alert('Para salvar como PDF: na janela de impressão que abrirá, selecione "Salvar como PDF" como destino.')
    window.print()
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <nav className="text-xs text-muted-foreground mb-1">
          <span>Dashboard Regional</span> <span className="mx-1">›</span> <span className="text-foreground">Relatórios</span>
        </nav>
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Relatórios Regionais</h1>
        <p className="text-sm text-muted-foreground">Região {regiaoLabel}</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Data Início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Data Fim</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Estado</label>
            <select
              value={estado}
              onChange={e => { setEstado(e.target.value); setMunicipio('') }}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos</option>
              {Object.keys(municipiosPorEstado).map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Município</label>
            <select
              value={municipio}
              onChange={e => setMunicipio(e.target.value)}
              disabled={!estado}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Todos</option>
              {municipiosDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option>Todos</option><option value="concluida">Concluída</option><option value="ativa">Ativa</option><option value="pausada">Pausada</option>
            </select>
          </div>
        </div>
        <button onClick={gerarRelatorio} className="mt-4 flex items-center gap-2 text-sm font-medium text-white rounded-full px-5 py-2 hover:opacity-90 transition-opacity" style={{ background: '#E91E8C' }}>
          📊 Gerar Relatório
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Multiplicadores" valor={resultado.multiplicadoras} cor="rosa" />
        <KpiCard label="Rodas Realizadas" valor={resultado.rodas} cor="rosa" />
        <KpiCard label="Pessoas Impactadas" valor={resultado.participantes} cor="azul" />
        <KpiCard label="Municípios" valor={resultado.municipios} cor="verde" />
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-heading font-semibold text-base">Participantes por Município</h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Excel (.xls)', fn: exportarExcel },
              { label: 'CSV', fn: exportarCSV },
              { label: 'PDF', fn: exportarPDF },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn} className="text-xs border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors">
                ↓ {label}
              </button>
            ))}
          </div>
        </div>
        {resultado.municipioData.length > 0
          ? <BarChartMunicipios data={resultado.municipioData} />
          : <p className="text-sm text-center text-muted-foreground py-8">Nenhum dado encontrado para os filtros selecionados.</p>
        }
      </div>

      <BairrosTable estadoExterno={resultado.estadoFiltro} municipioExterno={resultado.municipioFiltro} hideFilters />

    </div>
  )
}
