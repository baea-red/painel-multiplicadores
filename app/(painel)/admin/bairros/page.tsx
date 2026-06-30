'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'

const cardCores = ['#DBEAFE', '#FEF9C3', '#DCFCE7', '#FCE7F3', '#F3E8FF', '#FFEDD5']

export default function BairroRodasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; municipio?: string; bairro?: string }>
}) {
  const params = use(searchParams)
  const router = useRouter()
  const { rodas, multiplicadores } = useMultiplicadores()

  const estado = params.estado ?? ''
  const municipio = params.municipio ?? ''
  const bairro = params.bairro ?? ''

  const rodasDoBairro = rodas.filter(
    r => r.estado === estado && r.municipio === municipio && r.bairro === bairro
  )

  const ativas = rodasDoBairro.filter(r => r.status === 'ativa').length
  const totalParticipantes = rodasDoBairro.reduce((s, r) => s + r.participantes, 0)

  const mult = (id: string) => multiplicadores.find(m => m.id === id)

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Breadcrumb */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Header */}
      <div
        className="rounded-2xl px-5 py-6 sm:px-8 sm:py-8"
        style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}
      >
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
          {municipio} · {estado}
        </p>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">{bairro}</h1>
        <div className="flex flex-wrap gap-4 mt-4">
          {[
            { label: 'Rodas registradas', val: rodasDoBairro.length },
            { label: 'Rodas ativas', val: ativas },
            { label: 'Participantes', val: totalParticipantes },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/15 rounded-xl px-4 py-2.5">
              <p className="text-2xl font-heading font-bold text-white">{val}</p>
              <p className="text-white/70 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de rodas */}
      {rodasDoBairro.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-muted-foreground text-sm">
          Nenhuma roda registrada neste bairro.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rodasDoBairro.map((roda, i) => {
            const multiplicadora = mult(roda.multiplicadoraId)
            return (
              <div key={roda.id} className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
                {/* Topo colorido */}
                <div className="px-4 pt-4 pb-3" style={{ backgroundColor: cardCores[i % cardCores.length] }}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {roda.tipo === 'em_grupo' ? 'Em Grupo' : 'Individual'}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xl font-heading font-bold text-gray-800">
                      {new Date(roda.dataInicio).toLocaleDateString('pt-BR')}
                    </p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      roda.status === 'concluida' ? 'bg-white/70 text-gray-600' :
                      roda.status === 'ativa' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {roda.status === 'concluida' ? 'Registrada' :
                       roda.status === 'ativa' ? 'Em andamento' : 'Pausada'}
                    </span>
                  </div>
                </div>

                {/* Corpo */}
                <div className="px-4 py-4 space-y-3">
                  <p className="font-semibold text-gray-800 text-base">{roda.local}</p>

                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>📍</span>
                    <span>{roda.municipio} · {roda.bairro} · {roda.estado}</span>
                  </div>

                  {multiplicadora && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                        style={{ fontSize: 9, background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' }}
                      >
                        {multiplicadora.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <span className="truncate">{multiplicadora.nome}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span>👥</span>
                      <span><strong className="text-gray-800">{roda.participantes}</strong> participantes</span>
                    </div>
                    <Link
                      href={`/minhas-rodas/${roda.id}`}
                      className="text-xs font-medium border rounded-full px-3 py-1 hover:bg-pink-50 transition-colors whitespace-nowrap"
                      style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
