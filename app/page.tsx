'use client'

import Link from 'next/link'
import NavBar from './_components/NavBar'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'

export default function Home() {
  const { multiplicadores, rodas } = useMultiplicadores()
  const rodasConcluidas = rodas.filter(r => r.status === 'concluida')
  const formadas = multiplicadores.filter(m => m.status === 'formado').length
  const emFormacao = multiplicadores.filter(m => m.status === 'em_formacao' || m.status === 'aguardando_validacao').length
  const totalAtivas = formadas + emFormacao
  const municipios = new Set(rodasConcluidas.map(r => r.municipio)).size
  const estados = new Set(multiplicadores.map(m => m.estado)).size
  const pessoasImpactadas = rodasConcluidas.reduce((sum, r) => sum + r.participantes, 0)
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* Hero */}
      <section
        className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}
      >
        {/* Círculos decorativos */}
        <div aria-hidden="true" className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, -30%)' }} />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-8 bg-white" style={{ transform: 'translate(-30%, 30%)' }} />

        <div className="relative">
          <p className="text-white text-sm font-semibold uppercase tracking-widest mb-2">{totalAtivas} MULTIPLICADORAS ATIVAS</p>
          <h1 className="text-4xl sm:text-6xl font-heading font-bold text-white mb-2">Mulheres do Brasil</h1>
          <p className="text-white/80 text-xl italic mb-4">Núcleo Ceará</p>
          <p className="text-white/90 text-base max-w-lg mx-auto mb-10">
            Formando multiplicadores para transformar comunidades e promover saúde e cidadania em todo o Brasil.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/entrar"
              className="bg-white text-primary font-semibold px-8 py-3 rounded-full hover:bg-white/90 transition-colors text-base w-full sm:w-auto text-center"
            >
              Junte-se →
            </Link>
            <Link
              href="/mapa"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-colors text-base w-full sm:w-auto text-center"
            >
              Ver Mapa
            </Link>
          </div>
        </div>
      </section>

      {/* Nosso Impacto */}
      <section className="bg-background py-12 sm:py-16 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center text-foreground mb-2">Nosso Impacto</h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-10">Números que representam vidas transformadas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: 'Multiplicadoras Formadas', valor: String(formadas), cor: '#E91E8C' },
              { label: 'Rodas Realizadas', valor: String(rodasConcluidas.length), cor: '#C2185B' },
              { label: 'Municípios Atendidos', valor: String(municipios), cor: '#1565C0' },
              { label: 'Pessoas Impactadas', valor: String(pessoasImpactadas), cor: '#2E7D32' },
              { label: 'Estados Atendidos', valor: String(estados), cor: '#E65100' },
              { label: 'Em Formação', valor: String(emFormacao), cor: '#9E9E9E' },
            ].map(({ label, valor, cor }) => (
              <div key={label} className="bg-white rounded-2xl p-8 shadow-sm text-center relative overflow-hidden">
                <div aria-hidden="true" className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10" style={{ backgroundColor: cor }} />
                <dl>
                  <dd className="text-3xl font-heading font-bold mb-2 leading-tight" style={{ color: cor }}>{valor}</dd>
                  <dt className="text-sm text-muted-foreground font-medium">{label}</dt>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-12 sm:py-16 px-4 sm:px-8 text-center"
        style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}
      >
        <h2 className="text-2xl font-heading font-bold text-white mb-3">
          Faça parte da nossa rede
        </h2>
        <p className="text-white/70 mb-6">Junte-se a mulheres que estão transformando suas comunidades</p>
        <Link
          href="/entrar"
          className="bg-white text-primary font-semibold px-8 py-3 rounded-full hover:bg-white/90 transition-colors inline-block"
        >
          Criar conta gratuita
        </Link>
      </section>
    </div>
  )
}
