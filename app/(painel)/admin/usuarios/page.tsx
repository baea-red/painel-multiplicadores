'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePerfil } from '@/lib/context/perfil-context'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { coordenadores as coordenadoresMock, usuariosDemo } from '@/lib/data/mock'
import { usePagination } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/ui/pagination'
import type { Coordenador } from '@/lib/types'

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const statusLabel: Record<string, string> = {
  em_formacao: 'Em Prática',
  aguardando_validacao: 'Aguardando',
  formado: 'Formado',
  inativo: 'Inativo',
}

const statusCor: Record<string, string> = {
  em_formacao: 'bg-blue-100 text-blue-700',
  aguardando_validacao: 'bg-yellow-100 text-yellow-700',
  formado: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
}

type Tab = 'multiplicadores' | 'coordenadores' | 'administradores'

interface FormNova {
  nome: string; email: string; telefone: string
  municipio: string; estado: string; bairro: string
  senhaProvisoria: string; confirmarSenha: string
}

const formVazio: FormNova = {
  nome: '', email: '', telefone: '', municipio: '', estado: '', bairro: '',
  senhaProvisoria: '', confirmarSenha: '',
}

export default function UsuariosPage() {
  const router = useRouter()
  const { usuario } = usePerfil()
  const { multiplicadores, criarMultiplicadora, ativar, desativar } = useMultiplicadores()

  const [tab, setTab] = useState<Tab>('multiplicadores')
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<FormNova>(formVazio)
  const [erros, setErros] = useState<Partial<FormNova>>({})
  const [confirmandoToggle, setConfirmandoToggle] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState('')
  const [redefinindo, setRedefinindo] = useState<string | null>(null)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [novaSenhaForm, setNovaSenhaForm] = useState({ senha: '', confirmar: '', erro: '' })

  // Coordenadores local state (prototype — not persisted)
  const [coordenadoresState, setCoordenadoresState] = useState<Coordenador[]>(coordenadoresMock)
  const [coordAtivos, setCoordsAtivos] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(coordenadoresMock.map(c => [c.id, true]))
  )
  const [criandoCoord, setCriandoCoord] = useState(false)
  const [formCoord, setFormCoord] = useState({ nome: '', email: '', regiao: '', estados: [] as string[], senhaProvisoria: '', confirmarSenha: '' })
  const [errosCoord, setErrosCoord] = useState<Partial<typeof formCoord & { senhaProvisoria: string; confirmarSenha: string }>>({})
  const [confirmandoToggleCoord, setConfirmandoToggleCoord] = useState<string | null>(null)

  // Filtros compartilhados entre abas
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const multFiltradas = multiplicadores.filter(m => {
    const q = busca.toLowerCase()
    if (q && !m.nome.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false
    if (filtroStatus === 'ativo' && !m.ativo) return false
    if (filtroStatus === 'inativo' && m.ativo) return false
    if (['em_formacao', 'aguardando_validacao', 'formado'].includes(filtroStatus) && m.status !== filtroStatus) return false
    if (filtroEstado !== 'todos' && m.estado !== filtroEstado) return false
    return true
  })

  const coordFiltradas = coordenadoresState.filter(c => {
    const q = busca.toLowerCase()
    if (q && !c.nome.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false
    if (filtroEstado !== 'todos' && !c.estados.includes(filtroEstado)) return false
    if (filtroStatus !== 'todos') {
      const ativo = coordAtivos[c.id] ?? true
      if (filtroStatus === 'ativo' && !ativo) return false
      if (filtroStatus === 'inativo' && ativo) return false
    }
    return true
  })

  const paginacaoMult = usePagination(multFiltradas)
  const paginacaoCoord = usePagination(coordFiltradas)

  if (usuario && usuario.perfil !== 'administrador') {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Acesso restrito ao Administrador.
      </div>
    )
  }

  function campo(key: keyof FormNova, valor: string) {
    setForm(f => ({ ...f, [key]: valor }))
    setErros(e => ({ ...e, [key]: undefined }))
  }

  function validar(): boolean {
    const e: Partial<FormNova> = {}
    if (!form.nome.trim())       e.nome = 'Obrigatório'
    if (!form.email.trim())      e.email = 'Obrigatório'
    if (!form.telefone.trim())   e.telefone = 'Obrigatório'
    if (!form.municipio.trim())  e.municipio = 'Obrigatório'
    if (!form.estado)            e.estado = 'Obrigatório'
    if (!form.bairro.trim())     e.bairro = 'Obrigatório'
    if (form.senhaProvisoria.length < 6) e.senhaProvisoria = 'Mínimo 6 caracteres'
    if (form.confirmarSenha !== form.senhaProvisoria) e.confirmarSenha = 'Senhas não conferem'
    const emailJaExiste = multiplicadores.some(m => m.email.toLowerCase() === form.email.toLowerCase().trim())
    if (emailJaExiste) e.email = 'E-mail já cadastrado no sistema'
    setErros(e)
    return Object.keys(e).length === 0
  }

  function handleCriar() {
    if (!validar()) return
    const nome = form.nome
    criarMultiplicadora({
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      municipio: form.municipio,
      estado: form.estado,
      bairro: form.bairro,
      senhaProvisoria: form.senhaProvisoria,
    })
    setForm(formVazio)
    setCriando(false)
    setSucesso(`Multiplicador "${nome}" criado com sucesso.`)
    setTimeout(() => setSucesso(''), 4000)
  }

  function handleToggleAtivo(id: string, ativoAtual: boolean) {
    if (confirmandoToggle === id) {
      ativoAtual ? desativar(id) : ativar(id)
      setConfirmandoToggle(null)
      setSucesso(ativoAtual ? 'Conta desativada.' : 'Conta reativada.')
      setTimeout(() => setSucesso(''), 3000)
    } else {
      setConfirmandoToggle(id)
    }
  }

  function campoCoord(key: keyof typeof formCoord, valor: string | string[]) {
    setFormCoord(f => ({ ...f, [key]: valor }))
    setErrosCoord(e => ({ ...e, [key]: undefined }))
  }

  function validarCoord(): boolean {
    const e: Partial<typeof errosCoord> = {}
    if (!formCoord.nome.trim())  e.nome = 'Obrigatório'
    if (!formCoord.email.trim()) e.email = 'Obrigatório'
    if (formCoord.senhaProvisoria.length < 6) e.senhaProvisoria = 'Mínimo 6 caracteres'
    if (formCoord.confirmarSenha !== formCoord.senhaProvisoria) e.confirmarSenha = 'Senhas não conferem'
    setErrosCoord(e)
    return Object.keys(e).length === 0
  }

  function handleCriarCoord() {
    if (!validarCoord()) return
    const novaCoord: Coordenador = {
      id: `c-${Date.now()}`,
      nome: formCoord.nome,
      email: formCoord.email,
      regiao: formCoord.regiao,
      estados: formCoord.estados,
    }
    setCoordenadoresState(prev => [...prev, novaCoord])
    setCoordsAtivos(prev => ({ ...prev, [novaCoord.id]: true }))
    setFormCoord({ nome: '', email: '', regiao: '', estados: [], senhaProvisoria: '', confirmarSenha: '' })
    setCriandoCoord(false)
    setSucesso(`Coordenadora "${formCoord.nome}" criada com sucesso.`)
    setTimeout(() => setSucesso(''), 4000)
  }

  async function handleRedefinirSenha(userId: string, nome: string) {
    const { senha, confirmar } = novaSenhaForm
    if (senha.length < 6) { setNovaSenhaForm(f => ({ ...f, erro: 'Mínimo 6 caracteres' })); return }
    if (senha !== confirmar) { setNovaSenhaForm(f => ({ ...f, erro: 'Senhas não conferem' })); return }
    setSalvandoSenha(true)
    try {
      const { IS_MOCK_MODE } = await import('@/lib/api/client')
      if (!IS_MOCK_MODE) {
        const { api } = await import('@/lib/api/client')
        await api.post(`/usuarios/${userId}/redefinir-senha`, { novaSenha: senha })
      }
      setRedefinindo(null)
      setNovaSenhaForm({ senha: '', confirmar: '', erro: '' })
      setSucesso(`Senha de "${nome}" redefinida com sucesso.`)
      setTimeout(() => setSucesso(''), 4000)
    } catch (e: unknown) {
      setNovaSenhaForm(f => ({ ...f, erro: e instanceof Error ? e.message : 'Erro ao redefinir' }))
    } finally {
      setSalvandoSenha(false)
    }
  }

  function handleToggleCoord(id: string) {
    if (confirmandoToggleCoord === id) {
      const ativoAtual = coordAtivos[id]
      setCoordsAtivos(prev => ({ ...prev, [id]: !ativoAtual }))
      setConfirmandoToggleCoord(null)
      setSucesso(ativoAtual ? 'Conta desativada.' : 'Conta reativada.')
      setTimeout(() => setSucesso(''), 3000)
    } else {
      setConfirmandoToggleCoord(id)
    }
  }

  const admin = usuariosDemo['administrador']
  const coordenadorUsuario = usuariosDemo['coordenador']

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <nav className="text-xs text-muted-foreground mb-1">
        <span>Dashboard</span> <span className="mx-1">›</span>
        <span className="text-foreground font-medium">Gestão de Usuários</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Criar, editar, ativar e desativar usuários da plataforma.</p>
        </div>
        {tab === 'multiplicadores' && !criando && (
          <button
            onClick={() => { setCriando(true); setForm(formVazio); setErros({}) }}
            aria-label="Criar nova multiplicadora"
            className="self-start sm:self-auto flex items-center gap-2 text-sm font-semibold text-white rounded-full px-5 py-2.5 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
          >
            + Nova Multiplicadora
          </button>
        )}
        {tab === 'coordenadores' && !criandoCoord && (
          <button
            onClick={() => { setCriandoCoord(true); setErrosCoord({}) }}
            aria-label="Criar nova coordenadora"
            className="self-start sm:self-auto flex items-center gap-2 text-sm font-semibold text-white rounded-full px-5 py-2.5 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7B1FA2, #4A148C)' }}
          >
            + Nova Coordenadora
          </button>
        )}
      </div>

      {/* Aviso mock: dados de coordenadores não persistem */}
      {tab === 'coordenadores' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          ⚠️ Em modo de demonstração, coordenadores criados existem apenas nesta sessão e são perdidos ao recarregar a página.
        </div>
      )}

      {/* Notificação de sucesso */}
      {sucesso && (
        <div role="alert" aria-live="assertive" className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          ✅ {sucesso}
        </div>
      )}

      {/* Formulário de criação */}
      {criando && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-heading font-semibold text-base">Nova Multiplicadora</h2>
          <p className="text-xs text-muted-foreground -mt-2">Campos marcados com <span className="text-red-500">*</span> são obrigatórios. A senha provisória deve ter no mínimo 6 caracteres.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="sm:col-span-2">
              <label htmlFor="u-nome" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Nome Completo <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="u-nome" type="text" value={form.nome} onChange={e => campo('nome', e.target.value)}
                aria-required="true" aria-invalid={!!erros.nome}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              {erros.nome && <p className="text-xs text-red-500 mt-1" role="alert">{erros.nome}</p>}
            </div>

            {/* E-mail */}
            <div>
              <label htmlFor="u-email" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                E-mail <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="u-email" type="email" value={form.email} onChange={e => campo('email', e.target.value)}
                aria-required="true" aria-invalid={!!erros.email}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              {erros.email && <p className="text-xs text-red-500 mt-1" role="alert">{erros.email}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="u-tel" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Telefone <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="u-tel" type="tel" value={form.telefone} onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,11); campo('telefone', v.length<=2?`(${v}`:v.length<=7?`(${v.slice(0,2)}) ${v.slice(2)}`:v.length<=11?`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`:`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7,11)}`) }} placeholder="(99) 99999-9999"
                aria-required="true" aria-invalid={!!erros.telefone}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              {erros.telefone && <p className="text-xs text-red-500 mt-1" role="alert">{erros.telefone}</p>}
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="u-estado" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Estado <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <select id="u-estado" value={form.estado} onChange={e => campo('estado', e.target.value)}
                aria-required="true" aria-invalid={!!erros.estado}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white">
                <option value="">Selecione...</option>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              {erros.estado && <p className="text-xs text-red-500 mt-1" role="alert">{erros.estado}</p>}
            </div>

            {/* Município */}
            <div>
              <label htmlFor="u-municipio" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Município <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="u-municipio" type="text" value={form.municipio} onChange={e => campo('municipio', e.target.value)}
                aria-required="true" aria-invalid={!!erros.municipio}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              {erros.municipio && <p className="text-xs text-red-500 mt-1" role="alert">{erros.municipio}</p>}
            </div>

            {/* Bairro */}
            <div>
              <label htmlFor="u-bairro" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Bairro <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="u-bairro" type="text" value={form.bairro} onChange={e => campo('bairro', e.target.value)}
                aria-required="true" aria-invalid={!!erros.bairro}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              {erros.bairro && <p className="text-xs text-red-500 mt-1" role="alert">{erros.bairro}</p>}
            </div>

            {/* Senha provisória */}
            <div>
              <label htmlFor="u-senha" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Senha Provisória <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="u-senha" type="password" value={form.senhaProvisoria} onChange={e => campo('senhaProvisoria', e.target.value)}
                aria-required="true" aria-invalid={!!erros.senhaProvisoria}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              {erros.senhaProvisoria && <p className="text-xs text-red-500 mt-1" role="alert">{erros.senhaProvisoria}</p>}
            </div>

            {/* Confirmar senha */}
            <div>
              <label htmlFor="u-senha2" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Confirmar Senha <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="u-senha2" type="password" value={form.confirmarSenha} onChange={e => campo('confirmarSenha', e.target.value)}
                aria-required="true" aria-invalid={!!erros.confirmarSenha}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              {erros.confirmarSenha && <p className="text-xs text-red-500 mt-1" role="alert">{erros.confirmarSenha}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleCriar}
              className="text-sm font-semibold text-white rounded-xl px-6 py-2.5 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}>
              💾 Criar Usuária
            </button>
            <button onClick={() => { setCriando(false); setErros({}) }}
              aria-label="Cancelar criação"
              className="text-sm font-medium border border-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Formulário de criação de coordenadora */}
      {criandoCoord && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-heading font-semibold text-base">Nova Coordenadora</h2>
          <p className="text-xs text-muted-foreground -mt-2">Campos marcados com <span className="text-red-500">*</span> são obrigatórios. A senha provisória deve ter no mínimo 6 caracteres.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="c-nome" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Nome Completo <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="c-nome" type="text" value={formCoord.nome} onChange={e => campoCoord('nome', e.target.value)}
                aria-required="true" aria-invalid={!!errosCoord.nome}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              {errosCoord.nome && <p className="text-xs text-red-500 mt-1" role="alert">{errosCoord.nome}</p>}
            </div>

            <div>
              <label htmlFor="c-email" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                E-mail <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="c-email" type="email" value={formCoord.email} onChange={e => campoCoord('email', e.target.value)}
                aria-required="true" aria-invalid={!!errosCoord.email}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              {errosCoord.email && <p className="text-xs text-red-500 mt-1" role="alert">{errosCoord.email}</p>}
            </div>

            <div>
              <label htmlFor="c-regiao" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Região
              </label>
              <input id="c-regiao" type="text" value={formCoord.regiao} onChange={e => campoCoord('regiao', e.target.value)}
                placeholder="Ex: Nordeste"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Estados
              </label>
              <div className="flex flex-wrap gap-2">
                {ESTADOS_BR.map(uf => (
                  <button
                    key={uf}
                    type="button"
                    onClick={() => {
                      const current = formCoord.estados
                      campoCoord('estados', current.includes(uf) ? current.filter(e => e !== uf) : [...current, uf])
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      formCoord.estados.includes(uf)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {uf}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="c-senha" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Senha Provisória <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="c-senha" type="password" value={formCoord.senhaProvisoria} onChange={e => campoCoord('senhaProvisoria', e.target.value)}
                aria-required="true" aria-invalid={!!errosCoord.senhaProvisoria}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              {errosCoord.senhaProvisoria && <p className="text-xs text-red-500 mt-1" role="alert">{errosCoord.senhaProvisoria}</p>}
            </div>

            <div>
              <label htmlFor="c-senha2" className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                Confirmar Senha <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id="c-senha2" type="password" value={formCoord.confirmarSenha} onChange={e => campoCoord('confirmarSenha', e.target.value)}
                aria-required="true" aria-invalid={!!errosCoord.confirmarSenha}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              {errosCoord.confirmarSenha && <p className="text-xs text-red-500 mt-1" role="alert">{errosCoord.confirmarSenha}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleCriarCoord}
              className="text-sm font-semibold text-white rounded-xl px-6 py-2.5 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7B1FA2, #4A148C)' }}>
              Criar Coordenadora
            </button>
            <button onClick={() => { setCriandoCoord(false); setErrosCoord({}) }}
              aria-label="Cancelar criação"
              className="text-sm font-medium border border-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Buscar</label>
          <input
            type="text" value={busca}
            onChange={e => { setBusca(e.target.value); paginacaoMult.changePage(1); paginacaoCoord.changePage(1) }}
            placeholder="Nome ou e-mail..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Status</label>
          <select value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); paginacaoMult.changePage(1); paginacaoCoord.changePage(1) }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            {tab === 'multiplicadores' && <>
              <option value="em_formacao">Em Prática</option>
              <option value="aguardando_validacao">Aguardando</option>
              <option value="formado">Formado</option>
            </>}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Estado</label>
          <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); paginacaoMult.changePage(1); paginacaoCoord.changePage(1) }}
            disabled={tab === 'administradores'}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40 disabled:cursor-not-allowed">
            <option value="todos">Todos</option>
            {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex border-b border-gray-200 gap-1">
        {([
          ['multiplicadores', `Multiplicadores (${multFiltradas.length})`],
          ['coordenadores', `Coordenadoras (${coordFiltradas.length})`],
          ['administradores', 'Administradores (1)'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`}
            onClick={() => { setTab(id); setBusca(''); setFiltroStatus('todos'); setFiltroEstado('todos') }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Painel: Multiplicadores */}
      {tab === 'multiplicadores' && (
        <div role="tabpanel" id="panel-multiplicadoras" aria-labelledby="tab-multiplicadoras" className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Mobile */}
          <ul role="list" className="md:hidden divide-y divide-gray-50">
            {paginacaoMult.paginated.map(m => (
              <li key={m.id} className="px-4 py-3 flex items-center gap-3">
                <div aria-label={m.nome} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                  {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{m.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${statusCor[m.status]}`}>
                      {statusLabel[m.status]}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${m.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {m.ativo ? 'Conta ativa' : 'Conta desativada'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => router.push(`/admin/multiplicadoras/${m.id}?editar=true`)}
                    aria-label={`Editar dados de ${m.nome}`}
                    className="text-xs font-medium border rounded-full px-3 py-1 hover:bg-pink-50 transition-colors" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>
                    Editar
                  </button>
                  {confirmandoToggle === m.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleToggleAtivo(m.id, m.ativo)}
                        aria-label={`Confirmar ${m.ativo ? 'desativação' : 'reativação'} de ${m.nome}`}
                        className="text-xs font-semibold text-white rounded-full px-2 py-1 bg-red-500 hover:bg-red-600">
                        Sim
                      </button>
                      <button onClick={() => setConfirmandoToggle(null)} aria-label="Cancelar"
                        className="text-xs font-medium border border-gray-200 rounded-full px-2 py-1 hover:bg-gray-50">
                        Não
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleToggleAtivo(m.id, m.ativo)}
                      aria-label={`${m.ativo ? 'Desativar' : 'Reativar'} conta de ${m.nome}`}
                      className={`text-xs font-medium border rounded-full px-3 py-1 transition-colors ${m.ativo ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                      {m.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Lista de multiplicadores cadastradas</caption>
              <thead>
                <tr className="border-b border-gray-100">
                  {['Nome', 'E-mail', 'Estado / Município', 'Formação', 'Conta', 'Ações'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginacaoMult.paginated.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div aria-label={m.nome} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                          {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium truncate">{m.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{m.email}</td>
                    <td className="px-5 py-3 text-gray-500">{m.estado} · {m.municipio}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusCor[m.status]}`}>
                        {statusLabel[m.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${m.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {m.ativo ? 'Ativa' : 'Desativada'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => router.push(`/admin/multiplicadoras/${m.id}?editar=true`)}
                          aria-label={`Editar dados de ${m.nome}`}
                          className="text-xs font-medium border rounded-full px-3 py-1 hover:bg-pink-50 transition-colors" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>
                          Editar
                        </button>
                        {confirmandoToggle === m.id ? (
                          <div className="flex gap-1" role="alertdialog" aria-label={`Confirmar ${m.ativo ? 'desativação' : 'reativação'}`}>
                            <button onClick={() => handleToggleAtivo(m.id, m.ativo)}
                              aria-label={`Confirmar ${m.ativo ? 'desativação' : 'reativação'} de ${m.nome}`}
                              className="text-xs font-semibold text-white rounded-full px-3 py-1 bg-red-500 hover:bg-red-600">
                              Confirmar
                            </button>
                            <button onClick={() => setConfirmandoToggle(null)} aria-label="Cancelar ação"
                              className="text-xs font-medium border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmandoToggle(m.id)}
                            aria-label={`${m.ativo ? 'Desativar' : 'Reativar'} conta de ${m.nome}`}
                            className={`text-xs font-medium border rounded-full px-3 py-1 transition-colors ${m.ativo ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                            {m.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        )}
                        <button
                          onClick={() => { setRedefinindo(redefinindo === m.id ? null : m.id); setNovaSenhaForm({ senha: '', confirmar: '', erro: '' }) }}
                          aria-label={`Redefinir senha de ${m.nome}`}
                          title="Redefinir senha"
                          className="text-xs font-medium border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors text-gray-500">
                          🔑 Senha
                        </button>
                      </div>
                      {redefinindo === m.id && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <input type="password" placeholder="Nova senha" value={novaSenhaForm.senha}
                            onChange={e => setNovaSenhaForm(f => ({ ...f, senha: e.target.value, erro: '' }))}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <input type="password" placeholder="Confirmar" value={novaSenhaForm.confirmar}
                            onChange={e => setNovaSenhaForm(f => ({ ...f, confirmar: e.target.value, erro: '' }))}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <button onClick={() => handleRedefinirSenha(m.id, m.nome)}
                            disabled={salvandoSenha} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
                            style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}>
                            {salvandoSenha && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                            {salvandoSenha ? 'Salvando…' : 'Salvar'}
                          </button>
                          <button onClick={() => setRedefinindo(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                          {novaSenhaForm.erro && <p className="text-xs text-red-500 w-full" role="alert">{novaSenhaForm.erro}</p>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={paginacaoMult.page} totalPages={paginacaoMult.totalPages} total={paginacaoMult.total} pageSize={paginacaoMult.pageSize} onPage={paginacaoMult.changePage} onPageSize={paginacaoMult.changePageSize} />
        </div>
      )}

      {/* Painel: Coordenadores */}
      {tab === 'coordenadores' && (
        <div role="tabpanel" id="panel-coordenadores" aria-labelledby="tab-coordenadores" className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul role="list" className="divide-y divide-gray-50">
            {paginacaoCoord.paginated.map(c => {
              const ativo = coordAtivos[c.id] ?? true
              return (
                <li key={c.id} className="px-5 py-4 flex items-center gap-3">
                  <div aria-label={c.nome} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#7B1FA2' }}>
                    {c.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{c.nome}</p>
                    <p className="text-xs text-gray-400">{c.email}{c.regiao ? ` · ${c.regiao}` : ''}</p>
                    {c.estados.length > 0 && <p className="text-xs text-gray-400">Estados: {c.estados.join(', ')}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {ativo ? 'Ativa' : 'Desativada'}
                    </span>
                    {confirmandoToggleCoord === c.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleToggleCoord(c.id)}
                          aria-label={`Confirmar ${ativo ? 'desativação' : 'reativação'} de ${c.nome}`}
                          className="text-xs font-semibold text-white rounded-full px-2 py-1 bg-red-500 hover:bg-red-600">
                          Sim
                        </button>
                        <button onClick={() => setConfirmandoToggleCoord(null)} aria-label="Cancelar"
                          className="text-xs font-medium border border-gray-200 rounded-full px-2 py-1 hover:bg-gray-50">
                          Não
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleToggleCoord(c.id)}
                        aria-label={`${ativo ? 'Desativar' : 'Reativar'} conta de ${c.nome}`}
                        className={`text-xs font-medium border rounded-full px-3 py-1 transition-colors ${ativo ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                        {ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    )}
                    <button
                      onClick={() => { setRedefinindo(redefinindo === c.id ? null : c.id); setNovaSenhaForm({ senha: '', confirmar: '', erro: '' }) }}
                      aria-label={`Redefinir senha de ${c.nome}`}
                      title="Redefinir senha"
                      className="text-xs font-medium border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors text-gray-500">
                      🔑 Senha
                    </button>
                  </div>
                  {redefinindo === c.id && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap px-1">
                      <input type="password" placeholder="Nova senha" value={novaSenhaForm.senha}
                        onChange={e => setNovaSenhaForm(f => ({ ...f, senha: e.target.value, erro: '' }))}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <input type="password" placeholder="Confirmar" value={novaSenhaForm.confirmar}
                        onChange={e => setNovaSenhaForm(f => ({ ...f, confirmar: e.target.value, erro: '' }))}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <button onClick={() => handleRedefinirSenha(c.id, c.nome)}
                        disabled={salvandoSenha} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #7B1FA2, #4A148C)' }}>
                        {salvandoSenha && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                        {salvandoSenha ? 'Salvando…' : 'Salvar'}
                      </button>
                      <button onClick={() => setRedefinindo(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                      {novaSenhaForm.erro && <p className="text-xs text-red-500 w-full" role="alert">{novaSenhaForm.erro}</p>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <Pagination page={paginacaoCoord.page} totalPages={paginacaoCoord.totalPages} total={paginacaoCoord.total} pageSize={paginacaoCoord.pageSize} onPage={paginacaoCoord.changePage} onPageSize={paginacaoCoord.changePageSize} />
        </div>
      )}

      {/* Painel: Administradores */}
      {tab === 'administradores' && (
        <div role="tabpanel" id="panel-administradores" aria-labelledby="tab-administradores" className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50">
            <p className="text-xs text-amber-700">Administradores são provisionados diretamente no sistema. Edição disponível em versão futura.</p>
          </div>
          <ul role="list" className="divide-y divide-gray-50">
            <li className="px-5 py-4 flex items-center gap-3">
              <div aria-label={admin.nome} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#5E35B1' }}>
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{admin.nome}</p>
                <p className="text-xs text-gray-400">{admin.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Ativo</span>
                <button
                  onClick={() => { setRedefinindo(redefinindo === admin.id ? null : admin.id); setNovaSenhaForm({ senha: '', confirmar: '', erro: '' }) }}
                  aria-label="Redefinir senha do administrador"
                  className="text-xs font-medium border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors text-gray-500">
                  🔑 Senha
                </button>
              </div>
            </li>
            {redefinindo === admin.id && (
              <li className="px-5 py-3 flex items-center gap-2 flex-wrap bg-gray-50">
                <input type="password" placeholder="Nova senha" value={novaSenhaForm.senha}
                  onChange={e => setNovaSenhaForm(f => ({ ...f, senha: e.target.value, erro: '' }))}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input type="password" placeholder="Confirmar" value={novaSenhaForm.confirmar}
                  onChange={e => setNovaSenhaForm(f => ({ ...f, confirmar: e.target.value, erro: '' }))}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={() => handleRedefinirSenha(admin.id, admin.nome)}
                  disabled={salvandoSenha} className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #5E35B1, #311B92)' }}>
                  {salvandoSenha && <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                  {salvandoSenha ? 'Salvando…' : 'Salvar'}
                </button>
                <button onClick={() => setRedefinindo(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                {novaSenhaForm.erro && <p className="text-xs text-red-500 w-full" role="alert">{novaSenhaForm.erro}</p>}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
