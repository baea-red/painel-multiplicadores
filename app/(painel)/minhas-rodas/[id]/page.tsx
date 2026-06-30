'use client'

import { use, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { usePerfil } from '@/lib/context/perfil-context'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { coordenadores } from '@/lib/data/mock'
import { IS_MOCK_MODE } from '@/lib/api/client'
import { uploadArquivo } from '@/lib/api/upload'

const publicoAlvo = [
  'Mulheres de 24 a 65 anos',
  'Jovens a partir de 12 anos',
  'Mulheres de 18 a 60 anos',
  'Homens adultos',
  'Público em geral',
  'Jovens de 15 a 25 anos',
]

const statusLabel: Record<string, string> = {
  concluida: 'Registrada',
  ativa: 'Em andamento',
  pausada: 'Pausada',
}

const statusColor: Record<string, string> = {
  concluida: 'bg-blue-100 text-blue-700',
  ativa: 'bg-green-100 text-green-700',
  pausada: 'bg-yellow-100 text-yellow-700',
}

type Foto = { label: string; file: string | null }

export default function DetalheRodaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { usuario } = usePerfil()
  const { rodas, multiplicadores, atualizarRoda } = useMultiplicadores()

  const roda = rodas.find(r => r.id === id)

  const coordenador = usuario?.perfil === 'coordenador'
    ? coordenadores.find(c => c.id === usuario.coordenadorId)
    : null
  const ehDona = usuario?.perfil === 'multiplicadora' && roda != null && roda.multiplicadoraId === usuario.multiplicadoraId
  const podeEditar = usuario?.perfil === 'administrador' ||
    (usuario?.perfil === 'coordenador' && coordenador != null && roda != null && coordenador.estados.includes(roda.estado)) ||
    ehDona
  const mult = roda ? multiplicadores.find(m => m.id === roda.multiplicadoraId) : null
  const alvo = roda ? publicoAlvo[rodas.indexOf(roda) % publicoAlvo.length] : ''

  const [editing, setEditing] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    local: roda?.local ?? '',
    bairro: roda?.bairro ?? '',
    municipio: roda?.municipio ?? '',
    participantes: String(roda?.participantes ?? ''),
    status: roda?.status ?? 'ativa',
    tipo: roda?.tipo ?? 'em_grupo',
    dataFim: roda?.dataFim ?? '',
  })
  useEffect(() => {
    if (!editing && roda) {
      setForm({
        local: roda.local,
        bairro: roda.bairro,
        municipio: roda.municipio,
        participantes: String(roda.participantes),
        status: roda.status,
        tipo: roda.tipo,
        dataFim: roda.dataFim ?? '',
      })
      setFotos([
        { label: 'Foto da Roda de Conversa', file: roda.fotos?.[0] ?? null },
        { label: 'Foto da Lista de Frequência', file: roda.fotos?.[1] ?? null },
      ])
      setFrequencia(roda.frequencia ?? null)
    }
  }, [roda, editing])

  const [fotos, setFotos] = useState<Foto[]>([
    { label: 'Foto da Roda de Conversa', file: roda?.fotos?.[0] ?? null },
    { label: 'Foto da Lista de Frequência', file: roda?.fotos?.[1] ?? null },
  ])
  const [frequencia, setFrequencia] = useState<string | null>(roda?.frequencia ?? null)
  const freqRef = useRef<HTMLInputElement>(null)
  const fotoRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  if (!roda) return (
    <div className="p-6 text-center text-muted-foreground">Roda não encontrada.</div>
  )

  if (usuario?.perfil === 'multiplicadora' && !ehDona) return (
    <div className="p-10 text-center">
      <p className="text-2xl mb-2">🔒</p>
      <p className="font-semibold text-gray-700">Acesso restrito.</p>
      <p className="text-sm text-muted-foreground mt-1">Esta roda não pertence ao seu perfil.</p>
      <button onClick={() => router.back()} className="mt-4 text-sm font-medium hover:underline" style={{ color: '#E91E8C' }}>← Voltar</button>
    </div>
  )

  async function handleFoto(index: number, file: File) {
    if (IS_MOCK_MODE) {
      const url = URL.createObjectURL(file)
      setFotos(prev => prev.map((f, i) => i === index ? { ...f, file: url } : f))
      return
    }
    setUploading(true)
    try {
      const url = await uploadArquivo(file)
      setFotos(prev => prev.map((f, i) => i === index ? { ...f, file: url } : f))
    } catch {
      setToast({ msg: 'Erro ao enviar foto. Tente novamente.', tipo: 'erro' })
      setTimeout(() => setToast(null), 3500)
    } finally {
      setUploading(false)
    }
  }

  async function handleFrequencia(file: File) {
    if (IS_MOCK_MODE) { setFrequencia(file.name); return }
    setUploading(true)
    try {
      const url = await uploadArquivo(file)
      setFrequencia(url)
    } catch {
      setToast({ msg: 'Erro ao enviar lista de frequência. Tente novamente.', tipo: 'erro' })
      setTimeout(() => setToast(null), 3500)
    } finally {
      setUploading(false)
    }
  }

  function salvar() {
    setSalvando(true)
    const dados = {
      ...form,
      participantes: Number(form.participantes) || roda!.participantes,
      dataFim: form.status === 'concluida' && !form.dataFim
        ? new Date().toISOString().split('T')[0]
        : form.dataFim || undefined,
      fotos: fotos.map(f => f.file).filter((f): f is string => f !== null),
      frequencia: frequencia ?? undefined,
    }
    atualizarRoda(roda!.id, dados, () => {
      setSalvando(false)
      setEditing(false)
      setToast({ msg: 'Roda atualizada com sucesso', tipo: 'ok' })
      setTimeout(() => setToast(null), 3500)
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.back()} className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <span>›</span>
        <span className="text-foreground font-medium">Detalhe da Roda</span>
      </div>

      {/* Título + ações */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-heading font-bold">
          {roda.nome || `Roda em ${roda.municipio}`}
        </h1>
        {podeEditar && (
          editing ? (
            <div className="flex items-center gap-2">
              {uploading && <span className="text-xs text-muted-foreground animate-pulse">Enviando arquivo...</span>}
              <button
                onClick={() => setEditing(false)}
                className="text-sm border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors text-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="text-sm rounded-full px-4 py-1.5 font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
              >
                {salvando ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {uploading && <span className="text-xs text-muted-foreground animate-pulse">Enviando arquivo...</span>}
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors shrink-0"
              >
                ✏️ Editar
              </button>
            </div>
          )
        )}
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {editing ? (
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as import('@/lib/types').StatusRoda }))}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="ativa">Em andamento</option>
              <option value="concluida">Registrada</option>
              <option value="pausada">Pausada</option>
            </select>
          ) : (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor[roda.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {statusLabel[roda.status] ?? roda.status}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            Registrado em {new Date(roda.dataInicio).toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 border-t border-gray-100 pt-5">
          {/* Local */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Data</p>
            <p className="text-sm text-gray-800 font-medium">{new Date(roda.dataInicio).toLocaleDateString('pt-BR')}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Local</p>
            {editing
              ? <input value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              : <p className="text-sm text-gray-800 font-medium">{roda.local}</p>
            }
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Município</p>
            {editing
              ? <input value={form.municipio} onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              : <p className="text-sm text-gray-800 font-medium">{roda.municipio} · {roda.estado}</p>
            }
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Bairro</p>
            {editing
              ? <input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              : <p className="text-sm text-gray-800 font-medium">{roda.bairro}</p>
            }
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Realização</p>
            {editing
              ? (
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'em_grupo' | 'individual' }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
                  <option value="em_grupo">Em grupo</option>
                  <option value="individual">Individual</option>
                </select>
              )
              : <p className="text-sm text-gray-800 font-medium">{roda.tipo === 'em_grupo' ? 'Em grupo' : 'Individual'}</p>
            }
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Público-alvo</p>
            <p className="text-sm text-gray-800 font-medium">{alvo}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Participantes</p>
            {editing
              ? <input type="number" min="0" value={form.participantes} onChange={e => setForm(f => ({ ...f, participantes: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              : <p className="text-3xl font-heading font-bold" style={{ color: '#E91E8C' }}>{roda.participantes}</p>
            }
          </div>

          {mult && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Multiplicadora</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}>
                  {mult.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <span className="text-sm text-gray-800 font-medium">{mult.nome}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evidências fotográficas */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-base text-gray-800">Evidências Fotográficas</h2>
          {podeEditar && !editing && (
            <span className="text-xs text-gray-400">Entre no modo de edição para adicionar evidências</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fotos.map((foto, i) => (
            <div key={foto.label} className="rounded-xl border border-pink-100 bg-pink-50/40 flex flex-col items-center justify-center gap-3 py-8 px-4 text-center overflow-hidden">
              {foto.file ? (
                <>
                  <img src={foto.file} alt={foto.label} className="w-full h-40 object-cover rounded-lg" />
                  <p className="text-sm text-gray-600 font-medium">{foto.label}</p>
                  {podeEditar && editing && (
                    <button
                      onClick={() => setFotos(prev => prev.map((f, idx) => idx === i ? { ...f, file: null } : f))}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="text-4xl opacity-40">📷</span>
                  <p className="text-sm text-gray-500 font-medium">{foto.label}</p>
                  {podeEditar && editing ? (
                    <>
                      <button
                        onClick={() => fotoRefs[i].current?.click()}
                        className="text-xs font-semibold border-2 rounded-full px-4 py-1 hover:bg-pink-50 transition-colors"
                        style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
                      >
                        + Adicionar foto
                      </button>
                      <input
                        ref={fotoRefs[i]}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFoto(i, f) }}
                      />
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">Sem foto registrada</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Frequência */}
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
        <h2 className="font-heading font-semibold text-base text-gray-800">Lista de Frequência</h2>
        {frequencia ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <span className="text-2xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-700 truncate">{frequencia}</p>
              <p className="text-xs text-green-500 mt-0.5">Arquivo anexado com sucesso</p>
            </div>
            {podeEditar && editing && (
              <button
                onClick={() => setFrequencia(null)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                Remover
              </button>
            )}
          </div>
        ) : (
          podeEditar && editing ? (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-pink-300 hover:bg-pink-50/30 transition-colors">
              <span className="text-4xl">📁</span>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Clique para anexar a lista de frequência</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG · máx. 10MB</p>
              </div>
              <input
                ref={freqRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFrequencia(f) }}
              />
            </label>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
              <span className="text-3xl opacity-40">📋</span>
              <p className="text-sm">Nenhuma lista de frequência anexada</p>
            </div>
          )
        )}
      </div>

      {toast && (
        <div role="alert" aria-live="assertive" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-2"
          style={{ background: toast.tipo === 'ok' ? '#2E7D32' : '#D32F2F' }}>
          {toast.tipo === 'ok' ? '✓' : '✕'} {toast.msg}
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
