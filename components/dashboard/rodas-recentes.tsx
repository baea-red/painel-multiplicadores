'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'

const statusLabel: Record<string, string> = {
  ativa: 'Ativa',
  concluida: 'Concluída',
  pausada: 'Pausada',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  ativa: 'default',
  concluida: 'secondary',
  pausada: 'outline',
}

export function RodasRecentes() {
  const { rodas } = useMultiplicadores()
  const recentes = rodas.slice(0, 4)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base">Rodas Recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {recentes.map(roda => {
          return (
            <div key={roda.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{roda.nome}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{roda.municipio} · {roda.bairro}</span>
                  </div>
                </div>
                <Badge variant={statusVariant[roda.status]} className="shrink-0 text-xs">
                  {statusLabel[roda.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{roda.participantes} participantes</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
