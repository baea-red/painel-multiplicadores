'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'

const statusLabel: Record<string, string> = {
  em_formacao: 'Em Formação',
  formado: 'Formada',
  inativo: 'Inativa',
}

const statusColor: Record<string, string> = {
  em_formacao: 'bg-blue-100 text-blue-700',
  formado: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
}

export function MultiplicadoresRecentes() {
  const { getMinimoRodas, multiplicadores } = useMultiplicadores()
  const recentes = multiplicadores.slice(0, 5)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base">Multiplicadores Recentes</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recentes.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-bold">
                  {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{m.nome}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[m.status]}`}>
                    {statusLabel[m.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={Math.min(100, Math.round((m.rodasRealizadas / getMinimoRodas(m.estado, m)) * 100))} className="h-1 flex-1" />
                  <span className="text-xs text-muted-foreground shrink-0">{Math.min(100, Math.round((m.rodasRealizadas / getMinimoRodas(m.estado, m)) * 100))}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
