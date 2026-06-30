'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'
import { MultiplicadoraDrawer } from '@/components/dashboard/multiplicadora-drawer'
import type { Multiplicador } from '@/lib/types'

export default function ValidacaoPage() {
  const router = useRouter()
  const { usuario } = usePerfil()
  const { multiplicadores, aprovar: aprovarCtx, reprovar: reprovarCtx } = useMultiplicadores()
  const [drawer, setDrawer] = useState<Multiplicador | null>(null)
  const [confirmando, setConfirmando] = useState<{ m: Multiplicador; acao: 'aprovar' | 'reprovar' } | null>(null)
  const [toast, setToast] = useState<{ nome: string; acao: 'aprovada' | 'reprovada' } | null>(null)

  const coordenador = coordenadores.find(c => c.id === usuario?.coordenadorId)

  if (usuario && usuario.perfil !== 'coordenador') {
    return (
      <div className="p-10 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold text-gray-700">Acesso restrito ao Coordenador.</p>
      </div>
    )
  }

  const visiveis = multiplicadores.filter(m =>
    m.status === 'aguardando_validacao' &&
    (coordenador ? coordenador.estados.includes(m.estado) : false)
  )

  function confirmar() {
    if (!confirmando) return
    const { m, acao } = confirmando
    if (acao === 'aprovar') aprovarCtx(m.id)
    else reprovarCtx(m.id)
    setConfirmando(null)
    setToast({ nome: m.nome, acao: acao === 'aprovar' ? 'aprovada' : 'reprovada' })
    setTimeout(() => { setToast(null); router.push('/dashboard') }, 2000)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Validação de Formação</h1>
        <p className="text-sm text-muted-foreground">
          {visiveis.length} multiplicadora{visiveis.length !== 1 ? 's' : ''} aguardando avaliação
        </p>
      </div>

      {visiveis.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 sm:p-12 shadow-sm text-center">
          {!coordenador ? (
            <>
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="font-heading font-semibold text-lg">Coordenadora não encontrada no sistema.</h2>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">✅</div>
              <h2 className="font-heading font-semibold text-lg">Tudo em dia!</h2>
              <p className="text-sm text-muted-foreground mt-1">Nenhuma validação pendente.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visiveis.map(m => {
            const aberta = confirmando?.m.id === m.id
            return (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div aria-label={m.nome} aria-hidden="false" className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}>
                      {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base leading-tight">{m.nome}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span>📍</span> {m.municipio} · {m.estado}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">desde {new Date(m.dataIngresso).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                      Pendente
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { val: m.rodasRealizadas, label: 'Rodas', cor: '#E91E8C', bg: '#fdf2f8' },
                      { val: m.pessoasImpactadas, label: 'Impactadas', cor: '#1565C0', bg: '#eff6ff' },
                      { val: m.municipiosAtendidos, label: 'Municípios', cor: '#2E7D32', bg: '#f0fdf4' },
                    ].map(({ val, label, cor, bg }) => (
                      <div key={label} className="rounded-xl py-2.5 text-center" style={{ backgroundColor: bg }}>
                        <p className="text-xl font-heading font-bold leading-none" style={{ color: cor }}>{val}</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => setDrawer(m)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    📋 Registros
                  </button>
                  <button
                    onClick={() => setConfirmando(aberta && confirmando?.acao === 'reprovar' ? null : { m, acao: 'reprovar' })}
                    aria-label={`Reprovar ${m.nome}`}
                    aria-expanded={aberta && confirmando?.acao === 'reprovar'}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl py-2.5 transition-all border"
                    style={aberta && confirmando?.acao === 'reprovar'
                      ? { background: '#D32F2F', color: 'white', borderColor: '#D32F2F' }
                      : { background: 'white', color: '#D32F2F', borderColor: '#D32F2F' }}
                  >
                    ✕ Reprovar
                  </button>
                  <button
                    onClick={() => setConfirmando(aberta && confirmando?.acao === 'aprovar' ? null : { m, acao: 'aprovar' })}
                    aria-label={`Aprovar ${m.nome}`}
                    aria-expanded={aberta && confirmando?.acao === 'aprovar'}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl py-2.5 transition-all border"
                    style={aberta && confirmando?.acao === 'aprovar'
                      ? { background: '#2E7D32', color: 'white', borderColor: '#2E7D32' }
                      : { background: 'white', color: '#2E7D32', borderColor: '#2E7D32' }}
                  >
                    ✓ Aprovar
                  </button>
                </div>

                {/* Painel de confirmação (toggle) */}
                {aberta && (
                  <div
                    role="alertdialog"
                    aria-modal="true"
                    aria-label={confirmando?.acao === 'aprovar' ? `Confirmar aprovação de ${m.nome}` : `Confirmar reprovação de ${m.nome}`}
                    className="mx-4 mb-4 rounded-2xl p-4 flex items-center justify-between gap-3"
                    style={{ background: confirmando?.acao === 'aprovar' ? '#f0fdf4' : '#fff5f5', border: `1px solid ${confirmando?.acao === 'aprovar' ? '#bbf7d0' : '#fecaca'}` }}
                  >
                    <p className="text-sm font-medium" style={{ color: confirmando?.acao === 'aprovar' ? '#166534' : '#991b1b' }}>
                      {confirmando?.acao === 'aprovar'
                        ? `Confirmar aprovação de ${m.nome}?`
                        : `Confirmar reprovação de ${m.nome}?`}
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmando(null)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmar}
                        className="text-xs px-4 py-1.5 rounded-lg font-semibold text-white transition-colors"
                        style={{ background: confirmando?.acao === 'aprovar' ? '#2E7D32' : '#D32F2F' }}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <MultiplicadoraDrawer mult={drawer} onClose={() => setDrawer(null)} onToast={(msg, tipo) => { setToast({ nome: msg, acao: tipo === 'ok' ? 'aprovada' : 'reprovada' }); setTimeout(() => setToast(null), 3500) }} />

      {toast && (
        <div role="alert" aria-live="assertive" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-2"
          style={{ background: toast.acao === 'aprovada' ? '#2E7D32' : '#D32F2F' }}>
          {toast.acao === 'aprovada' ? '✓' : '✕'}
          <span><strong>{toast.nome}</strong> {toast.acao} com sucesso</span>
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
