'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, MapPin, Award } from 'lucide-react'
import type { Multiplicador } from '@/lib/types'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'

const statusLabel: Record<string, string> = {
  formado: 'Formado', em_formacao: 'Em Prática',
  aguardando_validacao: 'Aguardando Validação', inativo: 'Inativo',
}
const statusColor: Record<string, string> = {
  formado: 'bg-green-100 text-green-700', em_formacao: 'bg-blue-100 text-blue-700',
  aguardando_validacao: 'bg-yellow-100 text-yellow-700', inativo: 'bg-gray-100 text-gray-500',
}

interface Props {
  mult: Multiplicador | null
  onClose: () => void
  onToast?: (msg: string, tipo?: 'ok' | 'erro') => void
}

export function MultiplicadoraDrawer({ mult, onClose, onToast }: Props) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (mult) {
      triggerRef.current = document.activeElement
      const t = setTimeout(() => {
        setVisible(true)
        closeButtonRef.current?.focus()
      }, 10)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [mult])

  function handleClose() {
    setVisible(false)
    setTimeout(() => {
      onClose()
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
      }
    }, 280) // aguarda animação de saída
  }

  const { getMinimoRodas, aprovar, reprovar, rodas } = useMultiplicadores()
  const { usuario } = usePerfil()
  const [confirmandoReprovar, setConfirmandoReprovar] = useState(false)

  function handleAprovar() {
    if (!mult) return
    aprovar(mult.id)
    onToast?.(`${mult.nome} aprovada e certificada.`, 'ok')
    handleClose()
  }

  function handleReprovar() {
    if (!mult) return
    if (!confirmandoReprovar) { setConfirmandoReprovar(true); return }
    reprovar(mult.id)
    onToast?.(`Formação de ${mult.nome} reprovada.`, 'erro')
    setConfirmandoReprovar(false)
    handleClose()
  }
  const podeAprovar = usuario?.perfil === 'coordenador' || usuario?.perfil === 'administrador'
  const podeEditar = podeAprovar
  const [confirmandoAprovar, setConfirmandoAprovar] = useState(false)

  if (!mult) return null

  const rodasMult = rodas.filter(r => r.multiplicadoraId === mult.id)
  const minimoRodas = getMinimoRodas(mult.estado, mult)

  return (
    <>
      {/* Overlay */}
      <div
        role="presentation"
        onClick={handleClose}
        className="fixed inset-0 z-40 backdrop-blur-sm transition-all duration-300"
        style={{ background: visible ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)' }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes da multiplicadora"
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-6 py-5 flex items-start justify-between"
          style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {mult.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h2 className="font-heading font-bold text-white text-base leading-tight">{mult.nome}</h2>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-white/70" />
                <span className="text-white/70 text-xs">{mult.municipio} · {mult.estado}</span>
              </div>
              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[mult.status]}`}>
                {statusLabel[mult.status]}
              </span>
            </div>
          </div>
          <button ref={closeButtonRef} onClick={handleClose} aria-label="Fechar detalhes" className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <dl className="shrink-0 grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: 'Rodas realizadas', display: 'RODAS', val: mult.rodasRealizadas, cor: '#E91E8C' },
            { label: 'Pessoas impactadas', display: 'IMPACTADAS', val: mult.pessoasImpactadas, cor: '#1565C0' },
            { label: 'Municípios atendidos', display: 'MUNICÍPIOS', val: mult.municipiosAtendidos, cor: '#2E7D32' },
          ].map(({ label, display, val, cor }) => (
            <div key={display} className="py-4 text-center">
              <dd className="text-2xl font-heading font-bold" style={{ color: cor }}>{val}</dd>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5">
                <span className="sr-only">{label}</span>
                <span aria-hidden="true">{display}</span>
              </dt>
            </div>
          ))}
        </dl>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Progresso */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-gray-700">Progresso da Formação</span>
              <span className="font-bold" style={{ color: '#E91E8C' }}>{mult.rodasRealizadas}/{minimoRodas} rodas</span>
            </div>
            <div
              className="h-3 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-label={`Progresso da formação: ${mult.rodasRealizadas} de ${minimoRodas} rodas`}
              aria-valuenow={mult.rodasRealizadas}
              aria-valuemin={0}
              aria-valuemax={minimoRodas}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, (mult.rodasRealizadas / minimoRodas) * 100)}%`, background: 'linear-gradient(90deg, #E91E8C, #7B1FA2)' }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Ingresso: {new Date(mult.dataIngresso).toLocaleDateString('pt-BR')}</span>
              {mult.dataConclusao && <span>Conclusão: {new Date(mult.dataConclusao).toLocaleDateString('pt-BR')}</span>}
            </div>
          </div>

          {/* Dados pessoais */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Dados Pessoais</p>
            <div className="space-y-2">
              {[
                { label: 'E-mail', val: mult.email },
                { label: 'Telefone', val: mult.telefone },
                { label: 'Bairro', val: mult.bairro },
                { label: 'Município', val: `${mult.municipio} · ${mult.estado}` },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-sm font-medium text-gray-700">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodas */}
          {rodasMult.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Rodas Realizadas ({rodasMult.length})
              </p>
              <div className="space-y-2">
                {rodasMult.map(r => (
                  <div key={r.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800">{r.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        r.status === 'ativa' ? 'bg-green-100 text-green-700' :
                        r.status === 'concluida' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status === 'ativa' ? 'Ativa' : r.status === 'concluida' ? 'Concluída' : 'Pausada'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{r.local} · {r.bairro} · {r.participantes} participantes</div>
                    <button
                      onClick={() => { handleClose(); setTimeout(() => router.push(`/minhas-rodas/${r.id}`), 300) }}
                      className="w-full text-xs font-semibold py-1.5 rounded-lg border transition-colors hover:bg-pink-50"
                      style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
                    >
                      Ver detalhes →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificado */}
          <div className={`p-4 rounded-xl flex items-center gap-3 ${mult.certificadoEmitido ? 'bg-amber-50' : mult.status === 'formado' ? 'bg-green-50' : 'bg-gray-50'}`}>
            <Award className={`w-8 h-8 shrink-0 ${mult.certificadoEmitido ? 'text-amber-500' : mult.status === 'formado' ? 'text-green-500' : 'text-gray-300'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {mult.certificadoEmitido ? 'Certificado emitido' : mult.status === 'formado' ? 'Apta para certificação' : 'Certificado pendente'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {mult.certificadoEmitido ? 'Certificado gerado com sucesso' :
                 mult.status === 'formado' ? 'Formação concluída, aguardando emissão' :
                 `Faltam ${minimoRodas - mult.rodasRealizadas} rodas para completar a formação`}
              </p>
              {mult.status === 'formado' && !mult.certificadoEmitido && (
                <button
                  onClick={() => { handleClose(); setTimeout(() => router.push(`/admin/multiplicadoras/${mult.id}?tab=certificacao`), 300) }}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
                >
                  📎 Adicionar certificado
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="shrink-0 p-4 border-t border-gray-100 grid grid-cols-2 gap-3">
          {mult.status === 'aguardando_validacao' && podeAprovar && (
            <>
              <button
                onClick={handleReprovar}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmandoReprovar ? 'text-white border-0' : 'border-2 border-red-400 text-red-500 hover:bg-red-50'}`}
                style={confirmandoReprovar ? { background: '#D32F2F' } : undefined}
              >
                {confirmandoReprovar ? 'Confirmar reprovação?' : '✕ Reprovar'}
              </button>
              <button
                onClick={confirmandoReprovar
                  ? () => setConfirmandoReprovar(false)
                  : confirmandoAprovar
                    ? () => { handleAprovar(); setConfirmandoAprovar(false) }
                    : () => setConfirmandoAprovar(true)
                }
                className="py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: confirmandoReprovar ? '#757575' : '#2E7D32' }}
              >
                {confirmandoReprovar ? 'Cancelar' : confirmandoAprovar ? 'Confirmar aprovação?' : '✓ Aprovar'}
              </button>
            </>
          )}
          {mult.status !== 'aguardando_validacao' && (
            <>
              {podeEditar ? (
                <button
                  onClick={() => { handleClose(); setTimeout(() => router.push(`/admin/multiplicadoras/${mult.id}?editar=true`), 300) }}
                  className="py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ✏️ Editar
                </button>
              ) : (
                <button className="py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-300 cursor-not-allowed">
                  ✏️ Editar
                </button>
              )}
              <button
                onClick={() => { handleClose(); setTimeout(() => router.push(`/admin/multiplicadoras/${mult.id}`), 300) }}
                className="py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
              >
                📄 Ver Perfil Completo
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
