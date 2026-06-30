'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'
import { Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const BotaoCertificado = dynamic(
  () => import('@/components/certificados/certificado-pdf').then(m => m.BotaoCertificado),
  { ssr: false, loading: () => <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" /> }
)

export default function CertificadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { multiplicadores } = useMultiplicadores()
  const { usuario } = usePerfil()
  const mult = multiplicadores.find(m => m.id === id)

  if (!mult || mult.status !== 'formado') {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Certificado não disponível.</p>
      </div>
    )
  }

  if (!usuario || usuario.perfil === 'publico') {
    return (
      <div className="p-10 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold text-gray-700">Acesso restrito.</p>
        <p className="text-sm text-muted-foreground mt-1">Faça login para acessar este certificado.</p>
      </div>
    )
  }

  if (usuario?.perfil === 'multiplicadora' && id !== usuario.multiplicadoraId) {
    return (
      <div className="p-10 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold text-gray-700">Acesso restrito.</p>
        <p className="text-sm text-muted-foreground mt-1">Este certificado não pertence ao seu perfil.</p>
      </div>
    )
  }

  if (usuario?.perfil === 'coordenador') {
    const coordenador = coordenadores.find(c => c.id === usuario.coordenadorId)
    if (coordenador && !coordenador.estados.includes(mult.estado)) {
      return (
        <div className="p-10 text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold text-gray-700">Acesso restrito.</p>
          <p className="text-sm text-muted-foreground mt-1">Esta multiplicadora não pertence à sua região de coordenação.</p>
        </div>
      )
    }
  }

  return (
    <div className="p-6 flex items-center justify-center">
      <Card className="border-0 shadow-sm max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl">{mult.nome}</h2>
            <p className="text-muted-foreground text-sm mt-1">{mult.municipio} · {mult.bairro}</p>
          </div>
          {mult.dataConclusao && (
            <p className="text-sm text-muted-foreground">
              Concluído em: <span className="font-medium text-foreground">
                {new Date(mult.dataConclusao).toLocaleDateString('pt-BR')}
              </span>
            </p>
          )}
          <BotaoCertificado multiplicador={mult} />
        </CardContent>
      </Card>
    </div>
  )
}
