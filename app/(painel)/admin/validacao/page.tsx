'use client'

import { useState } from 'react'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'
import { MultiplicadoraDrawer } from '@/components/dashboard/multiplicadora-drawer'
import { usePagination } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/ui/pagination'
import type { Multiplicador } from '@/lib/types'

type Toast = { id: string; nome: string; acao: 'aprovada' | 'reprovada' }

export default function ValidacaoPage() {
  const { multiplicadores, aprovar: aprovarCtx, reprovar: reprovarCtx } = useMultiplicadores()
  const { usuario } = usePerfil()
  const [drawer, setDrawer] = useState<Multiplicador | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [confirmando, setConfirmando] = useState<{ id: string; acao: 'aprovar' | 'reprovar' } | null>(null)

  const podeAprovar = usuario?.perfil === 'coordenador' || usuario?.perfil === 'administrador'

  const coordenador = usuario?.perfil === 'coordenador'
    ? coordenadores.find(c => c.id === usuario.coordenadorId)
    : null

  const visiveis = multiplicadores.filter(m => {
    if (m.status !== 'aguardando_validacao') return false
    if (coordenador) return coordenador.estados.includes(m.estado)
    return true
  })
  const { paginated, page, pageSize, totalPages, total, changePage, changePageSize } = usePagination(visiveis)

  function aprovar(m: Multiplicador) {
    aprovarCtx(m.id)
    setToast({ id: m.id, nome: m.nome, acao: 'aprovada' })
    setTimeout(() => setToast(null), 3500)
  }

  function reprovar(m: Multiplicador) {
    reprovarCtx(m.id)
    setToast({ id: m.id, nome: m.nome, acao: 'reprovada' })
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Validação de Formação</h1>
        <p className="text-sm text-muted-foreground">
          {visiveis.length} multiplicadora{visiveis.length !== 1 ? 's' : ''} aguardando avaliação
        </p>
      </div>

      {!podeAprovar && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Visualização apenas. A aprovação é exclusiva da Coordenação (REGRAS.md § 1.2).
        </div>
      )}

      {visiveis.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 sm:p-12 shadow-sm text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="font-heading font-semibold text-lg">Tudo em dia!</h2>
          <p className="text-sm text-muted-foreground mt-1">Nenhuma validação pendente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginated.map(m => (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header com gradiente */}
              <div className="p-4 sm:p-5 bg-white">
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

                {/* Stats inline */}
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
              <div className="p-3 flex gap-2 border-t border-gray-100">
                <button
                  onClick={() => setDrawer(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors text-gray-600"
                >
                  📋 Registros
                </button>
                {podeAprovar && (
                  <>
                    {confirmando?.id === m.id ? (
                      <>
                        <span className="flex-1 flex items-center justify-center text-xs font-medium text-gray-600">
                          Confirmar {confirmando.acao === 'aprovar' ? 'aprovação' : 'reprovação'}?
                        </span>
                        <button
                          onClick={() => { confirmando.acao === 'aprovar' ? aprovar(m) : reprovar(m); setConfirmando(null) }}
                          className="flex-1 flex items-center justify-center text-sm font-semibold text-white rounded-xl py-2.5 hover:opacity-90 transition-opacity"
                          style={{ background: confirmando.acao === 'aprovar' ? '#2E7D32' : '#D32F2F' }}
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmando(null)}
                          className="flex-1 flex items-center justify-center text-sm font-medium border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors text-gray-600"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmando({ id: m.id, acao: 'reprovar' })}
                          aria-label={`Reprovar ${m.nome}`}
                          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white rounded-xl py-2.5 hover:opacity-90 transition-opacity"
                          style={{ background: '#D32F2F' }}
                        >
                          ✕ Reprovar
                        </button>
                        <button
                          onClick={() => setConfirmando({ id: m.id, acao: 'aprovar' })}
                          aria-label={`Aprovar ${m.nome}`}
                          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white rounded-xl py-2.5 hover:opacity-90 transition-opacity"
                          style={{ background: '#2E7D32' }}
                        >
                          ✓ Aprovar
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={changePage} onPageSize={changePageSize} />
          </div>
        </div>
      )}

      <MultiplicadoraDrawer mult={drawer} onClose={() => setDrawer(null)} />

      {/* Toast */}
      {toast && (
        <div role="alert" aria-live="assertive" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-2 transition-all"
          style={{ background: toast.acao === 'aprovada' ? '#2E7D32' : '#D32F2F' }}>
          {toast.acao === 'aprovada' ? '✓' : '✕'}
          <span><strong>{toast.nome}</strong> {toast.acao} com sucesso</span>
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
