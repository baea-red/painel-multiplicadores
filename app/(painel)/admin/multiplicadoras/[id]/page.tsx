'use client'

import React, { use, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'

const BotaoCertificado = dynamic(
  () => import('@/components/certificados/certificado-pdf').then(m => m.BotaoCertificado),
  { ssr: false, loading: () => <div className="h-10 w-40 bg-gray-100 animate-pulse rounded-full" /> }
)

const statusLabel: Record<string, string> = {
  formado: 'Formado', em_formacao: 'Em Prática',
  aguardando_validacao: 'Aguardando Validação', inativo: 'Inativo',
}
const statusColor: Record<string, string> = {
  formado: 'bg-green-100 text-green-700',
  em_formacao: 'bg-blue-100 text-blue-700',
  aguardando_validacao: 'bg-yellow-100 text-yellow-700',
  inativo: 'bg-gray-100 text-gray-500',
}

function Field({ label, value, formKey, editing, form, setForm }: {
  label: string
  value: string
  formKey: string
  editing: boolean
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">{label}</label>
      {editing
        ? <input
            value={form[formKey] ?? ''}
            onChange={e => setForm(f => ({ ...f, [formKey]: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        : <div className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-700 truncate">{value}</div>
      }
    </div>
  )
}

const publicoAlvo = [
  'Mulheres de 24 a 65 anos',
  'Jovens a partir de 12 anos',
  'Mulheres de 24 a 65 anos',
  'Homens adultos',
  'Público em geral',
  'Mulheres de 18 a 60 anos',
  'Jovens de 15 a 25 anos',
]

const MAX_FILE_BYTES = 10 * 1024 * 1024

export default function PerfilMultiplicadoraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { multiplicadores, rodas: todasRodas, atualizarMultiplicadora, aprovar, reprovar } = useMultiplicadores()
  const { usuario } = usePerfil()
  const podeAprovar = usuario?.perfil === 'administrador' || usuario?.perfil === 'coordenador'

  const startTab = (searchParams.get('tab') as 'dados' | 'historico' | 'certificacao') ?? 'dados'
  const [tab, setTab] = useState<'dados' | 'historico' | 'certificacao'>(startTab)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [uploadErro, setUploadErro] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)
  const [confirmandoAprovar, setConfirmandoAprovar] = useState(false)
  const [confirmandoReprovar, setConfirmandoReprovar] = useState(false)
  const startEditing = searchParams.get('editar') === 'true'

  const mult = multiplicadores.find(m => m.id === id)
  const rodasMult = todasRodas.filter(r => r.multiplicadoraId === id)

  const [editing, setEditing] = useState(startEditing)
  const [form, setForm] = useState<Record<string, string>>(() => ({
    nome: mult?.nome ?? '',
    email: mult?.email ?? '',
    telefone: mult?.telefone ?? '',
    estado: mult?.estado ?? '',
    municipio: mult?.municipio ?? '',
    bairro: mult?.bairro ?? '',
  }))

  function showToast(msg: string, tipo: 'ok' | 'erro' = 'ok') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  if (!mult) return (
    <div className="p-6 text-center text-muted-foreground">Multiplicadora não encontrada.</div>
  )

  function iniciarEdicao() {
    setForm({ nome: mult!.nome, email: mult!.email, telefone: mult!.telefone, estado: mult!.estado, municipio: mult!.municipio, bairro: mult!.bairro })
    setEditing(true)
  }

  function salvar() {
    const emailEmUso = multiplicadores.some(m => m.id !== mult!.id && m.email.toLowerCase() === form.email.toLowerCase().trim())
    if (emailEmUso) { showToast('Este e-mail já está cadastrado para outro usuário.', 'erro'); return }
    atualizarMultiplicadora(mult!.id, {
      nome: form.nome,
      email: form.email.trim(),
      telefone: form.telefone,
      estado: form.estado,
      municipio: form.municipio,
      bairro: form.bairro,
    }, () => {
      setEditing(false)
      showToast('Dados atualizados com sucesso.')
    })
  }

  function handleAprovar() {
    aprovar(mult!.id)
    showToast(`${mult!.nome} aprovada e certificada.`)
    setTab('certificacao')
  }

  function handleReprovar() {
    reprovar(mult!.id)
    showToast(`Formação de ${mult!.nome} reprovada.`, 'erro')
  }

  function handleUpload(f: File) {
    setUploadErro(null)
    if (f.size > MAX_FILE_BYTES) {
      setUploadErro('Arquivo excede o limite de 10MB.')
      return
    }
    setUploadedFile(f.name)
  }

  const formada = mult.status === 'formado'
  const aguardando = mult.status === 'aguardando_validacao'

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Breadcrumb */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Card Perfil */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
          >
            {mult.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading font-bold text-2xl text-gray-900">{mult.nome}</h1>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${statusColor[mult.status]}`}>
                {statusLabel[mult.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
              <span>📍 {mult.municipio} · {mult.estado}</span>
              <span className="text-gray-300">·</span>
              <span>Cadastrada em {new Date(mult.dataIngresso).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-gray-100">
          {[
            { label: 'Rodas realizadas', val: mult.rodasRealizadas, cor: '#E91E8C', bg: '#fdf2f8' },
            { label: 'Municípios atendidos', val: mult.municipiosAtendidos, cor: '#7B1FA2', bg: '#f5f3ff' },
            { label: 'Pessoas impactadas', val: mult.pessoasImpactadas, cor: '#1565C0', bg: '#eff6ff' },
          ].map(({ label, val, cor, bg }) => (
            <div key={label} className="rounded-xl p-4" style={{ backgroundColor: bg }}>
              <p className="text-3xl font-heading font-bold" style={{ color: cor }}>{val}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Card Tabs */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 px-6">
          {([
            ['dados', 'Dados Pessoais'],
            ['historico', 'Histórico de Rodas'],
            ['certificacao', 'Certificação'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-4 mr-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Dados Pessoais */}
          {tab === 'dados' && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-sm border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors text-gray-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={salvar}
                      className="text-sm rounded-full px-4 py-1.5 font-semibold text-white transition-colors"
                      style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
                    >
                      💾 Salvar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={iniciarEdicao}
                    className="text-sm border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors"
                  >
                    ✏️ Editar
                  </button>
                )}
              </div>

              <Field label="Nome Completo" value={mult.nome} formKey="nome" editing={editing} form={form} setForm={setForm} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="E-mail" value={mult.email} formKey="email" editing={editing} form={form} setForm={setForm} />
                <Field label="Telefone" value={mult.telefone} formKey="telefone" editing={editing} form={form} setForm={setForm} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Estado" value={mult.estado} formKey="estado" editing={editing} form={form} setForm={setForm} />
                <Field label="Município" value={mult.municipio} formKey="municipio" editing={editing} form={form} setForm={setForm} />
              </div>
              <Field label="Bairro" value={mult.bairro} formKey="bairro" editing={editing} form={form} setForm={setForm} />
            </div>
          )}

          {/* Histórico de Rodas */}
          {tab === 'historico' && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {rodasMult.length} roda{rodasMult.length !== 1 ? 's' : ''} registrada{rodasMult.length !== 1 ? 's' : ''}
              </p>
              {rodasMult.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 text-sm">Nenhuma roda registrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Data', 'Município', 'Local', 'Público-alvo', 'Participantes'].map(h => (
                          <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rodasMult.map((r, i) => (
                        <tr key={r.id} className="border-b border-gray-50">
                          <td className="py-3 text-gray-600 whitespace-nowrap">
                            {new Date(r.dataInicio).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 text-gray-600">{r.municipio}</td>
                          <td className="py-3 text-gray-600">{r.local}</td>
                          <td className="py-3 text-gray-500 text-xs max-w-[120px]">
                            {publicoAlvo[i % publicoAlvo.length]}
                          </td>
                          <td className="py-3 font-bold" style={{ color: '#E91E8C' }}>{r.participantes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Certificação — timeline */}
          {tab === 'certificacao' && (
            <div className="space-y-0">
              {[
                {
                  label: 'Formação Teórica',
                  desc: mult.dataIngresso ? `3 aulas concluídas · ${new Date(mult.dataIngresso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}` : '3 aulas concluídas',
                  done: true,
                },
                {
                  label: 'Formação Prática',
                  desc: `${mult.rodasRealizadas} roda${mult.rodasRealizadas !== 1 ? 's' : ''} concluída${mult.rodasRealizadas !== 1 ? 's' : ''}`,
                  done: mult.rodasRealizadas >= 5,
                },
                {
                  label: 'Certificação',
                  desc: formada && mult.dataConclusao
                    ? `Certificada em ${new Date(mult.dataConclusao).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
                    : aguardando ? 'Aguardando validação' : 'Pendente',
                  done: formada,
                },
              ].map(({ label, desc, done }, i, arr) => (
                <div key={label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <CheckCircle2 className={`w-5 h-5 ${done ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${done ? 'bg-green-300' : 'bg-gray-200'}`} style={{ minHeight: 32 }} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`font-semibold text-sm ${done ? 'text-green-600' : 'text-gray-400'}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}

              {/* Botão emitir + upload */}
              {formada && (
                <div className="pt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-start flex-wrap">
                    {mult.certificadoEmitido && (
                      <span className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">✓ Certificado já emitido</span>
                    )}
                    <BotaoCertificado multiplicador={mult} />
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Enviar certificado assinado</p>
                    <p className="text-xs text-gray-400 mb-3">Faça upload do certificado em PDF ou imagem para anexar ao perfil da multiplicadora.</p>

                    {uploadedFile ? (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="text-amber-600 text-lg">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-700 truncate">{uploadedFile}</p>
                          <p className="text-xs text-amber-500">Arquivo selecionado — será enviado ao confirmar</p>
                        </div>
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-primary hover:bg-pink-50/30 transition-colors">
                        <span className="text-3xl">📁</span>
                        <span className="text-sm font-medium text-gray-600">Clique para selecionar o arquivo</span>
                        <span className="text-xs text-gray-400">PDF, JPG ou PNG · máx. 10MB</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
                        />
                      </label>
                    )}
                    {uploadErro && <p className="text-xs text-red-500 mt-2" role="alert">{uploadErro}</p>}
                  </div>
                </div>
              )}

              {aguardando && podeAprovar && (
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => confirmandoReprovar ? (handleReprovar(), setConfirmandoReprovar(false)) : setConfirmandoReprovar(true)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${confirmandoReprovar ? 'text-white' : 'border-2 border-red-400 text-red-500 hover:bg-red-50'}`}
                    style={confirmandoReprovar ? { background: '#D32F2F' } : undefined}
                  >
                    {confirmandoReprovar ? 'Confirmar reprovação?' : '✕ Reprovar'}
                  </button>
                  {confirmandoReprovar ? (
                    <button onClick={() => setConfirmandoReprovar(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                  ) : (
                    <button
                      onClick={() => confirmandoAprovar ? (handleAprovar(), setConfirmandoAprovar(false)) : setConfirmandoAprovar(true)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity ${confirmandoAprovar ? 'ring-2 ring-offset-1 ring-green-400' : ''}`}
                      style={{ background: '#2E7D32' }}
                    >
                      {confirmandoAprovar ? 'Confirmar aprovação?' : '✓ Aprovar e certificar'}
                    </button>
                  )}
                  {confirmandoAprovar && !confirmandoReprovar && (
                    <button onClick={() => setConfirmandoAprovar(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div role="alert" aria-live="assertive"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-3"
          style={{ background: toast.tipo === 'ok' ? '#2E7D32' : '#D32F2F' }}
        >
          {toast.tipo === 'ok' ? '✓' : '✕'} {toast.msg}
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
