'use client'

import { useState } from 'react'
import { usePagination } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/ui/pagination'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { StatusMultiplicador } from '@/lib/types'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'

const statusLabel: Record<StatusMultiplicador, string> = {
  em_formacao: 'Em Formação',
  aguardando_validacao: 'Aguardando Validação',
  formado: 'Formada',
  inativo: 'Inativa',
}

const statusColor: Record<StatusMultiplicador, string> = {
  em_formacao: 'bg-blue-100 text-blue-700',
  aguardando_validacao: 'bg-yellow-100 text-yellow-700',
  formado: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
}

export function ListaMultiplicadores() {
  const { getMinimoRodas, multiplicadores, rodas } = useMultiplicadores()
  const { usuario } = usePerfil()
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusMultiplicador | 'todos'>('todos')

  const coordenador = usuario?.perfil === 'coordenador'
    ? coordenadores.find(c => c.id === usuario.coordenadorId)
    : null
  const base = coordenador
    ? multiplicadores.filter(m => coordenador.estados.includes(m.estado))
    : multiplicadores

  const filtradas = base.filter(m => {
    const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.municipio.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || m.status === filtroStatus
    return matchBusca && matchStatus
  })

  const { paginated, page, pageSize, totalPages, total, changePage, changePageSize } = usePagination(filtradas)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <CardTitle className="font-heading text-base">
            Multiplicadores <span className="text-muted-foreground font-normal text-sm">({filtradas.length})</span>
          </CardTitle>

          <div className="flex gap-2 flex-wrap">
            {(['todos', 'em_formacao', 'aguardando_validacao', 'formado', 'inativo'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filtroStatus === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {s === 'todos' ? 'Todas' : statusLabel[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou município..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {paginated.map(m => {
            const roda = rodas.find(r => r.multiplicadoraId === m.id)
            return (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary text-xs font-bold">
                    {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{m.nome}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[m.status]}`}>
                      {statusLabel[m.status]}
                    </span>
                    {m.certificadoEmitido && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                        Certificada
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.municipio} · {m.bairro} · {roda?.nome ?? 'Sem roda'}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={Math.min(100, Math.round((m.rodasRealizadas / getMinimoRodas(m.estado, m)) * 100))} className="h-1.5 flex-1 max-w-32" />
                    <span className="text-xs text-muted-foreground">{Math.min(100, Math.round((m.rodasRealizadas / getMinimoRodas(m.estado, m)) * 100))}%</span>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0 hidden sm:block">
                  <div>Ingresso</div>
                  <div className="font-medium text-foreground">
                    {new Date(m.dataIngresso).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            )
          })}
          {filtradas.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhuma multiplicadora encontrada</p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 border-t border-border pt-3">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={changePage} onPageSize={changePageSize} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
