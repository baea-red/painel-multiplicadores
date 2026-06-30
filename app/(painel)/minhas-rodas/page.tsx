'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePerfil } from '@/lib/context/perfil-context'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { NovaRodaDialog } from '@/components/rodas/nova-roda-dialog'
import { usePagination } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/ui/pagination'

const cardCores = ['#DBEAFE', '#FEF9C3', '#DCFCE7', '#FCE7F3', '#F3E8FF', '#FFEDD5']

export default function MinhasRodasPage() {
  const { usuario } = usePerfil()
  const { multiplicadores, rodas } = useMultiplicadores()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroCidade, setFiltroCidade] = useState('')
  const [filtroData, setFiltroData] = useState('')

  const mult = multiplicadores.find(m => m.id === usuario?.multiplicadoraId)
  const minhasRodas = mult ? rodas.filter(r => r.multiplicadoraId === mult.id) : []
  const estadosUnicos = Array.from(new Set(minhasRodas.map(r => r.estado)))

  const rodasFiltradas = minhasRodas.filter(r => {
    if (filtroEstado !== 'Todos' && r.estado !== filtroEstado) return false
    if (filtroCidade && !r.municipio.toLowerCase().includes(filtroCidade.toLowerCase())) return false
    if (filtroData.trim()) {
      const parts = filtroData.trim().split('/')
      if (parts.length === 2) {
        const mes = parseInt(parts[0], 10)
        const ano = parseInt(parts[1], 10)
        if (!isNaN(mes) && !isNaN(ano)) {
          const d = new Date(r.dataInicio)
          if (d.getMonth() + 1 !== mes || d.getFullYear() !== ano) return false
        }
      }
    }
    return true
  })

  const { paginated, page, pageSize, totalPages, total, changePage, changePageSize } = usePagination(rodasFiltradas)

  if (!mult) return <div className="p-6 text-center text-muted-foreground">Perfil não encontrado.</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Minhas Rodas</h1>
          <p className="text-sm text-muted-foreground">{minhasRodas.length} rodas registradas</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          aria-label="Registrar nova roda"
          className="flex items-center gap-2 text-sm font-medium text-white rounded-full px-5 py-2"
          style={{ background: '#E91E8C' }}
        >
          + Nova Roda
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Estado</label>
            <select
              aria-label="Filtrar por estado"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option>Todos</option>
              {estadosUnicos.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Cidade</label>
            <input
              type="text"
              placeholder="Filtrar por cidade..."
              aria-label="Filtrar por cidade"
              value={filtroCidade}
              onChange={e => setFiltroCidade(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Data</label>
            <input
              type="text"
              placeholder="Ex: 03/2024"
              aria-label="Filtrar por data (MM/AAAA)"
              value={filtroData}
              onChange={e => setFiltroData(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {minhasRodas.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="font-heading font-semibold text-lg text-gray-700">Nenhuma roda registrada ainda</h2>
          <p className="text-sm text-muted-foreground mt-1">Clique em <strong>+ Nova Roda</strong> para registrar sua primeira roda de conversa.</p>
        </div>
      )}

      {minhasRodas.length > 0 && rodasFiltradas.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Nenhuma roda encontrada com os filtros aplicados.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((roda, i) => (
          <article key={roda.id} className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="px-4 pt-4 pb-3" style={{ backgroundColor: cardCores[i % cardCores.length] }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {roda.tipo === 'em_grupo' ? 'Em Grupo' : 'Individual'}
              </p>
              <div className="flex items-start justify-between mt-0.5">
                <p className="text-xl font-heading font-bold text-gray-800">
                  {new Date(roda.dataInicio).toLocaleDateString('pt-BR')}
                </p>
                <span className="text-xs px-2 py-0.5 bg-white/70 rounded-full text-gray-600 font-medium mt-0.5">
                  {roda.status === 'concluida' ? 'Registrada' : roda.status === 'ativa' ? 'Em andamento' : 'Pausada'}
                </span>
              </div>
            </div>
            <div className="bg-white px-4 py-3 space-y-2">
              <p className="font-semibold text-gray-800">{roda.nome || roda.local}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>📍</span><span>{roda.municipio} · {roda.estado}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span>👥</span><span>{roda.participantes} participantes</span>
                </div>
                <Link
                  href={`/minhas-rodas/${roda.id}`}
                  className="text-xs font-medium border rounded-full px-3 py-1 transition-colors hover:bg-pink-50"
                  style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          </article>
        ))}

        <button
          onClick={() => setDialogOpen(true)}
          aria-label="Registrar nova roda"
          className="rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-pink-50/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl" style={{ background: '#E91E8C' }}>+</div>
          <p className="text-sm font-medium text-gray-500">Registrar nova roda</p>
        </button>
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={changePage} onPageSize={changePageSize} />}

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
