'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePerfil } from '@/lib/context/perfil-context'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'


export default function EntrarPage() {
  const { login, usuario, loading } = usePerfil()
  const { multiplicadores, rodas } = useMultiplicadores()
  const rodasConcluidas = rodas.filter(r => r.status === 'concluida')
  const formadas = multiplicadores.filter(m => m.status === 'formado').length
  const pessoasImpactadas = rodasConcluidas.reduce((sum, r) => sum + r.participantes, 0)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarInfoConta, setMostrarInfoConta] = useState(false)

  useEffect(() => {
    if (!loading && usuario) router.replace('/dashboard')
  }, [loading, usuario, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const result = await login(email, senha)
    if (result.error) {
      setErro(result.error)
      setCarregando(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Esquerda — rosa */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #7B1FA2 100%)' }}
      >
        <div aria-hidden="true" className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%,-30%)' }} />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 bg-white" style={{ transform: 'translate(-30%,30%)' }} />

        <span className="text-white font-heading font-bold text-xl relative">Grupo Mulheres do Brasil</span>

        <div className="relative space-y-4">
          <h2 className="text-4xl font-heading font-bold text-white leading-tight">
            Grupo Mulheres<br />do Brasil
          </h2>
          <p className="text-white/70 text-lg italic">
            "Cada mulher formada é uma comunidade transformada."
          </p>
          <div className="flex gap-8 pt-4">
            {[{ val: String(formadas), label: 'FORMADAS' }, { val: String(rodasConcluidas.length), label: 'RODAS' }, { val: String(pessoasImpactadas), label: 'IMPACTADAS' }].map(({ val, label }) => (
              <div key={label}>
                <p className="text-white text-2xl font-heading font-bold">{val}</p>
                <p className="text-white/60 text-xs font-semibold tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div />
      </div>

      {/* Direita — formulário */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Entrar</h1>
            <p className="text-muted-foreground text-sm mt-1">Bem-vinda de volta à plataforma.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                E-MAIL <span aria-hidden="true" className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                aria-required="true"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                SENHA <span aria-hidden="true" className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                aria-required="true"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="text-right mt-1">
                <p className="text-xs text-muted-foreground">Esqueceu a senha? Contate sua coordenadora.</p>
              </div>
            </div>

            {erro && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
            >
              {carregando ? 'Verificando...' : 'Entrar na plataforma'}
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {mostrarInfoConta ? (
              <p className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600">
                O acesso é concedido pela sua coordenadora regional. Entre em contato com ela para solicitar seu cadastro.
              </p>
            ) : (
              <p>
                Não tem conta?{' '}
                <button onClick={() => setMostrarInfoConta(true)} aria-label="Saiba como criar uma conta" className="text-primary font-semibold hover:underline">
                  Criar conta
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
