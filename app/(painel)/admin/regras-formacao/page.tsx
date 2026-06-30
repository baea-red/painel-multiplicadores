'use client'

import { useState } from 'react'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'

const ESTADOS_DISPONIVEIS = [
  { uf: 'AC', nome: 'Acre' }, { uf: 'AL', nome: 'Alagoas' }, { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' }, { uf: 'BA', nome: 'Bahia' }, { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' }, { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' }, { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' }, { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' }, { uf: 'PE', nome: 'Pernambuco' }, { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' }, { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' }, { uf: 'RR', nome: 'Roraima' }, { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' }, { uf: 'SE', nome: 'Sergipe' }, { uf: 'TO', nome: 'Tocantins' },
]

export default function RegrasFormacaoPage() {
  const { usuario } = usePerfil()
  const { getMinimoRodas, atualizarMinimoRodas } = useMultiplicadores()
  const [toast, setToast] = useState<string | null>(null)

  function atualizar(uf: string, nome: string, valor: number, valorAnterior: number) {
    atualizarMinimoRodas(uf, valor, () => {
      atualizarMinimoRodas(uf, valorAnterior)
      setToast(`Erro ao atualizar ${nome}. Alteração desfeita.`)
      setTimeout(() => setToast(null), 4000)
    })
    setToast(`${nome}: mínimo atualizado para ${valor} roda${valor !== 1 ? 's' : ''}.`)
    setTimeout(() => setToast(null), 2500)
  }

  if (usuario && usuario.perfil !== 'administrador') {
    return (
      <div className="p-10 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold text-gray-700">Acesso restrito ao Administrador.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Regras de Formação</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Define o mínimo de rodas por estado para solicitar validação de formação.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {ESTADOS_DISPONIVEIS.map(({ uf, nome }) => {
            const minimo = getMinimoRodas(uf)
            return (
              <div key={uf} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' }}>
                    {uf}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => atualizar(uf, nome, Math.max(1, minimo - 1), minimo)}
                    className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-base font-bold transition-colors"
                    disabled={minimo <= 1}
                  >−</button>
                  <span className="w-8 text-center text-sm font-bold text-gray-800">{minimo}</span>
                  <button
                    onClick={() => atualizar(uf, nome, minimo + 1, minimo)}
                    className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-base font-bold transition-colors"
                  >+</button>
                  <span className="text-xs text-gray-400 ml-1 hidden sm:inline">roda{minimo !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {toast && (
        <div role="alert" aria-live="assertive"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
        >
          ✓ {toast}
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
