'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MapPin, Users, Plus } from 'lucide-react'
import { rodas, multiplicadores } from '@/lib/data/mock'
import type { StatusRoda } from '@/lib/types'
import { NovaRodaDialog } from './nova-roda-dialog'

const statusLabel: Record<StatusRoda, string> = { ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada' }
const statusColor: Record<StatusRoda, string> = {
  ativa: 'bg-green-100 text-green-700',
  concluida: 'bg-blue-100 text-blue-700',
  pausada: 'bg-amber-100 text-amber-700',
}

export function ListaRodas() {
  const [filtro, setFiltro] = useState<StatusRoda | 'todas'>('todas')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtradas = filtro === 'todas' ? rodas : rodas.filter(r => r.status === filtro)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {(['todas', 'ativa', 'concluida', 'pausada'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              aria-pressed={filtro === s}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filtro === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {s === 'todas' ? 'Todas' : statusLabel[s]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />Nova Roda
        </button>
      </div>

      <div role="list" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtradas.map(roda => {
          const mult = multiplicadores.find(m => m.id === roda.multiplicadoraId)

          return (
            <article key={roda.id} role="listitem">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="font-heading text-base">{roda.nome}</CardTitle>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[roda.status]}`}>
                    {statusLabel[roda.status]}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />{roda.municipio} · {roda.bairro}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{roda.participantes} participantes</p>
                {mult && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-[9px] font-bold">{mult.nome.split(' ')[0][0]}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{mult.nome}</span>
                  </div>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>Início: {new Date(roda.dataInicio).toLocaleDateString('pt-BR')}</span>
                  {roda.dataFim && <span>Fim: {new Date(roda.dataFim).toLocaleDateString('pt-BR')}</span>}
                </div>
              </CardContent>
            </Card>
            </article>
          )
        })}
      </div>

      <NovaRodaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
