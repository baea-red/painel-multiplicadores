import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { multiplicadores, rodas } from '@/lib/data/mock'

export function DistribuicaoMunicipios() {
  const municipiosMap = new Map<string, { multiplicadoras: number; rodas: number }>()

  for (const m of multiplicadores) {
    const entry = municipiosMap.get(m.municipio) ?? { multiplicadoras: 0, rodas: 0 }
    entry.multiplicadoras++
    municipiosMap.set(m.municipio, entry)
  }
  for (const r of rodas) {
    const entry = municipiosMap.get(r.municipio) ?? { multiplicadoras: 0, rodas: 0 }
    entry.rodas++
    municipiosMap.set(r.municipio, entry)
  }

  const municipios = Array.from(municipiosMap.entries())
    .sort((a, b) => b[1].multiplicadoras - a[1].multiplicadoras)

  const max = Math.max(...municipios.map(([, v]) => v.multiplicadoras))

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base">Distribuição por Município</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {municipios.map(([nome, dados]) => (
          <div key={nome}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-foreground">{nome}</span>
              <span className="text-muted-foreground text-xs">
                {dados.multiplicadoras} mult. · {dados.rodas} rodas
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(dados.multiplicadoras / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
