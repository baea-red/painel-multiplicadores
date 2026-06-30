'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { coordenadores as coordenadoresData } from '@/lib/data/mock'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'

type TabConfig = 'multiplicadores' | 'coordenadores' | 'administradores'
type Perfil = 'Multiplicador' | 'Coordenador' | 'Administrador'

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

interface UsuarioForm {
  nome: string; email: string; telefone: string
  perfil: Perfil; estados: string[]; municipio: string; senha: string
}

interface Row {
  id: string; nome: string; email: string; perfil: string; status: string; criado: string
  telefone?: string; estados?: string[]; municipio?: string
}

const admins: Row[] = [
  { id: 'a1', nome: 'Administrador', email: 'admin@gmb.org', perfil: 'Administrador', status: 'Ativo', criado: '2023-12-01', estados: ['CE', 'SP', 'BA', 'RJ'] },
]

const EMPTY: UsuarioForm = { nome: '', email: '', telefone: '', perfil: 'Multiplicador', estados: [], municipio: '', senha: '' }

type DrawerMode = 'criar' | 'editar' | null

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { usuario } = usePerfil()
  const { multiplicadores, configuracoes, getMinimoRodas, atualizarMinimoRodas, criarMultiplicadora, ativar, desativar } = useMultiplicadores()
  const [tab, setTab] = useState<TabConfig>('multiplicadores')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroPerfil, setFiltroPerfil] = useState('todos')
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<UsuarioForm>(EMPTY)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<{ ts: string; msg: string }[]>([])
  const [confirmandoToggle, setConfirmandoToggle] = useState<string | null>(null)

  function addAudit(msg: string) {
    const ts = new Date().toLocaleString('pt-BR')
    setAuditLog(prev => [{ ts, msg }, ...prev].slice(0, 20))
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  if (!usuario) {
    return <div className="p-10 text-center text-muted-foreground text-sm">Carregando...</div>
  }

  if (usuario.perfil !== 'administrador') {
    return (
      <div className="p-10 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold text-gray-700">Acesso restrito ao Administrador.</p>
      </div>
    )
  }

  function toggleStatus(id: string, atual: string, perfil: string, nome: string) {
    if (confirmandoToggle !== id) { setConfirmandoToggle(id); return }
    setConfirmandoToggle(null)
    const novoStatus = atual === 'Ativo' ? 'Inativo' : 'Ativo'
    setStatusOverride(s => ({ ...s, [id]: novoStatus }))
    if (perfil === 'Multiplicador') {
      if (atual === 'Ativo') desativar(id)
      else ativar(id)
    }
    addAudit(`${nome} (${perfil}) — conta ${novoStatus === 'Ativo' ? 'reativada' : 'desativada'}.`)
  }

  useEffect(() => {
    if (drawerMode) {
      const t = setTimeout(() => setDrawerVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setDrawerVisible(false)
    }
  }, [drawerMode])

  function abrirCriar() {
    setForm(EMPTY)
    setEditandoId(null)
    setSucesso(false)
    setDrawerMode('criar')
  }

  function abrirEditar(row: Row) {
    setForm({
      nome: row.nome,
      email: row.email,
      telefone: row.telefone ?? '',
      perfil: row.perfil as Perfil,
      estados: row.estados ?? [],
      municipio: row.municipio ?? '',
      senha: '',
    })
    setEditandoId(row.id)
    setSucesso(false)
    setDrawerMode('editar')
  }

  function fechar() {
    setDrawerVisible(false)
    setTimeout(() => { setDrawerMode(null); setForm(EMPTY); setSucesso(false); setEditandoId(null) }, 280)
  }

  const [estadosBusca, setEstadosBusca] = useState('')
  const [estadosAberto, setEstadosAberto] = useState(false)

  function set(field: keyof UsuarioForm, val: string) {
    setForm(f => ({ ...f, [field]: val }))
  }

  function toggleEstado(uf: string) {
    setForm(f => ({
      ...f,
      estados: f.estados.includes(uf) ? f.estados.filter(e => e !== uf) : [...f.estados, uf],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setTimeout(() => {
      if (drawerMode === 'criar' && form.perfil === 'Multiplicador') {
        criarMultiplicadora({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          municipio: form.municipio,
          estado: form.estados[0] ?? '',
          bairro: '',
          senhaProvisoria: form.senha,
        })
      }
      setSalvando(false)
      setSucesso(true)
      addAudit(drawerMode === 'criar' ? `Usuário "${form.nome}" (${form.perfil}) criado.` : `Dados de "${form.nome}" atualizados.`)
      setTimeout(() => fechar(), 1800)
    }, 900)
  }

  const todosRows: Row[] = [
    ...multiplicadores.map(m => ({ id: m.id, nome: m.nome, email: m.email, perfil: 'Multiplicador', status: m.ativo ? 'Ativo' : 'Inativo', criado: m.dataIngresso, telefone: m.telefone, estados: [m.estado], municipio: m.municipio })),
    ...coordenadoresData.map(c => ({ id: c.id, nome: c.nome, email: c.email, perfil: 'Coordenador', status: 'Ativo', criado: '2024-01-01', estados: c.estados })),
    ...admins,
  ].map(r => ({ ...r, status: statusOverride[r.id] ?? r.status }))

  const rows: Row[] = todosRows.filter(r => {
    const q = busca.toLowerCase()
    if (q && !r.nome.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false
    if (filtroStatus !== 'todos' && r.status.toLowerCase() !== filtroStatus) return false
    if (filtroEstado !== 'todos' && !r.estados?.includes(filtroEstado)) return false
    if (filtroPerfil !== 'todos' && r.perfil.toLowerCase() !== filtroPerfil) return false
    return true
  })

  const isEditar = drawerMode === 'editar'

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Gestão de Usuários</h1>
        {(
          <button
            onClick={abrirCriar}
            className="self-start text-sm font-medium text-white rounded-full px-5 py-2 hover:opacity-90 transition-opacity"
            style={{ background: '#E91E8C' }}
          >
            + Novo Usuário
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Buscar</label>
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Nome ou e-mail..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Perfil</label>
          <select value={filtroPerfil} onChange={e => setFiltroPerfil(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="todos">Todos</option>
            <option value="multiplicador">Multiplicador</option>
            <option value="coordenador">Coordenador</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Status</label>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Estado</label>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="todos">Todos</option>
            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>
      {(busca || filtroStatus !== 'todos' || filtroEstado !== 'todos' || filtroPerfil !== 'todos') && (
        <div className="flex justify-end">
          <button
            onClick={() => { setBusca(''); setFiltroStatus('todos'); setFiltroEstado('todos'); setFiltroPerfil('todos') }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Desktop: tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Nome', 'E-mail', 'Perfil', 'Estados', 'Status', 'Criado Em', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                        {r.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <span className="font-medium">{r.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.email}</td>
                  <td className="px-4 py-3 text-gray-500">{r.perfil}</td>
                  <td className="px-4 py-3">
                    {r.estados && r.estados.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {r.estados.slice(0, 3).map(uf => (
                          <span key={uf} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#E91E8C' }}>{uf}</span>
                        ))}
                        {r.estados.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">+{r.estados.length - 3}</span>
                        )}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.criado).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <button onClick={() => abrirEditar(r)} className="text-xs font-medium border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-50 text-gray-600 whitespace-nowrap transition-colors">✏️ Editar</button>
                      {confirmandoToggle === r.id ? (
                        <>
                          <button onClick={() => toggleStatus(r.id, r.status, r.perfil, r.nome)} className="text-xs font-semibold text-white rounded-full px-2.5 py-1 bg-red-500 hover:bg-red-600 whitespace-nowrap">Confirmar</button>
                          <button onClick={() => setConfirmandoToggle(null)} className="text-xs font-medium border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-50 text-gray-500 whitespace-nowrap">Cancelar</button>
                        </>
                      ) : (
                        <button onClick={() => toggleStatus(r.id, r.status, r.perfil, r.nome)} className={`text-xs font-medium rounded-full px-2.5 py-1 hover:opacity-90 whitespace-nowrap transition-opacity text-white ${r.status === 'Ativo' ? 'bg-red-500' : 'bg-gray-400'}`}>{r.status === 'Ativo' ? 'Desativar' : 'Ativar'}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {rows.map(r => (
            <div key={r.id} className="px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                {r.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{r.nome}</p>
                <p className="text-xs text-gray-400 truncate">{r.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400">{r.perfil}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                  {r.estados && r.estados.slice(0, 2).map(uf => (
                    <span key={uf} className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#E91E8C' }}>{uf}</span>
                  ))}
                  {r.estados && r.estados.length > 2 && <span className="text-[10px] text-gray-400">+{r.estados.length - 2}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => abrirEditar(r)} className="text-xs font-medium border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 text-gray-600 transition-colors">✏️ Editar</button>
                {confirmandoToggle === r.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => toggleStatus(r.id, r.status, r.perfil, r.nome)} className="text-xs font-semibold text-white rounded-full px-2 py-1 bg-red-500 hover:bg-red-600">Sim</button>
                    <button onClick={() => setConfirmandoToggle(null)} className="text-xs font-medium border border-gray-200 rounded-full px-2 py-1 hover:bg-gray-50 text-gray-500">Não</button>
                  </div>
                ) : (
                  <button onClick={() => toggleStatus(r.id, r.status, r.perfil, r.nome)} className={`text-xs font-medium rounded-full px-3 py-1 hover:opacity-90 transition-opacity text-white ${r.status === 'Ativo' ? 'bg-red-500' : 'bg-gray-400'}`}>{r.status === 'Ativo' ? 'Desativar' : 'Ativar'}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer lateral — Criar / Editar */}
      {drawerMode && (
        <>
          <div
            onClick={fechar}
            className="fixed inset-0 z-40 backdrop-blur-sm transition-all duration-300"
            style={{ background: drawerVisible ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)' }}
          />

          <div
            className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
            style={{
              transform: drawerVisible ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Header */}
            <div
              className="shrink-0 flex items-center justify-between px-6 py-5"
              style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
            >
              <div>
                {isEditar ? (
                  <>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {form.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <h2 className="font-heading font-bold text-white text-lg leading-tight">{form.nome}</h2>
                    </div>
                    <p className="text-white/70 text-xs">Editar dados do usuário</p>
                  </>
                ) : (
                  <>
                    <h2 className="font-heading font-bold text-white text-lg">Novo Usuário</h2>
                    <p className="text-white/70 text-xs mt-0.5">Preencha os dados para criar o acesso</p>
                  </>
                )}
              </div>
              <button onClick={fechar} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto">
              {sucesso ? (
                <div className="px-6 py-16 text-center space-y-3">
                  <div className="text-5xl">✅</div>
                  <p className="font-heading font-bold text-lg text-gray-800">
                    {isEditar ? 'Alterações salvas!' : 'Usuário criado!'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isEditar ? 'Os dados foram atualizados com sucesso.' : 'O acesso foi configurado com sucesso.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                  {/* Perfil — só editável na criação */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Perfil <span className="text-red-400">*</span></label>
                    <div className="flex gap-2">
                      {(['Multiplicador', 'Coordenador', 'Administrador'] as Perfil[]).map(p => (
                        <button
                          key={p} type="button"
                          disabled={isEditar}
                          onClick={() => set('perfil', p)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                            form.perfil === p
                              ? 'border-primary text-white'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          } ${isEditar ? 'opacity-60 cursor-not-allowed' : ''}`}
                          style={form.perfil === p ? { background: '#E91E8C', borderColor: '#E91E8C' } : {}}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    {isEditar && <p className="text-xs text-gray-400 mt-1.5">O perfil não pode ser alterado após a criação.</p>}
                  </div>

                  {/* Nome + Telefone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Nome completo <span className="text-red-400">*</span></label>
                      <input type="text" required value={form.nome} onChange={e => set('nome', e.target.value)}
                        placeholder="Ana Lima"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Telefone</label>
                      <input type="tel" value={form.telefone} onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,11); set('telefone', v.length<=2?`(${v}`:v.length<=7?`(${v.slice(0,2)}) ${v.slice(2)}`:v.length<=11?`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`:`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7,11)}`) }} placeholder="(99) 99999-9999"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">E-mail <span className="text-red-400">*</span></label>
                    <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="usuario@email.com"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>

                  {/* Estados (multi) — Coordenador / Administrador */}
                  {form.perfil !== 'Multiplicador' && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                        Estados vinculados
                        {form.estados.length > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#E91E8C' }}>
                            {form.estados.length}
                          </span>
                        )}
                      </label>

                      {/* Chips dos selecionados */}
                      {form.estados.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {form.estados.map(uf => (
                            <span key={uf} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' }}>
                              {uf}
                              <button type="button" onClick={() => toggleEstado(uf)} className="ml-0.5 hover:opacity-70 transition-opacity">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dropdown de seleção */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setEstadosAberto(o => !o)}
                          className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <span className="text-gray-400">{form.estados.length === 0 ? 'Selecionar estados...' : `${form.estados.length} estado${form.estados.length > 1 ? 's' : ''} selecionado${form.estados.length > 1 ? 's' : ''}`}</span>
                          {estadosAberto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>

                        {estadosAberto && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            <div className="p-2 border-b border-gray-100">
                              <input
                                autoFocus
                                type="text"
                                value={estadosBusca}
                                onChange={e => setEstadosBusca(e.target.value)}
                                placeholder="Buscar estado..."
                                className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {ESTADOS_DISPONIVEIS.filter(e =>
                                !estadosBusca || e.nome.toLowerCase().includes(estadosBusca.toLowerCase()) || e.uf.toLowerCase().includes(estadosBusca.toLowerCase())
                              ).map(({ uf, nome }) => {
                                const sel = form.estados.includes(uf)
                                return (
                                  <button
                                    key={uf} type="button"
                                    onClick={() => toggleEstado(uf)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${sel ? 'font-medium' : ''}`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${sel ? 'border-transparent' : 'border-gray-300'}`}
                                        style={sel ? { background: '#E91E8C' } : {}}>
                                        {sel && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                      </span>
                                      <span className="font-mono text-xs text-gray-400 w-6">{uf}</span>
                                      <span className="text-gray-700">{nome}</span>
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                            <div className="p-2 border-t border-gray-100 flex justify-between items-center">
                              <button type="button" onClick={() => setForm(f => ({ ...f, estados: ESTADOS_DISPONIVEIS.map(e => e.uf) }))} className="text-xs text-primary hover:underline">Selecionar todos</button>
                              <button type="button" onClick={() => { setEstadosAberto(false); setEstadosBusca('') }} className="text-xs font-semibold text-white rounded-full px-3 py-1" style={{ background: '#E91E8C' }}>Confirmar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estado + Município — só Multiplicador */}
                  {form.perfil === 'Multiplicador' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Estado</label>
                        <select value={form.estados[0] ?? ''} onChange={e => setForm(f => ({ ...f, estados: e.target.value ? [e.target.value] : [] }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                          <option value="">Selecionar</option>
                          {ESTADOS_DISPONIVEIS.map(({ uf, nome }) => <option key={uf} value={uf}>{nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Município</label>
                        <input type="text" value={form.municipio} onChange={e => set('municipio', e.target.value)}
                          placeholder="Fortaleza"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                  )}

                  {/* Senha — opcional na edição */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                      {isEditar ? 'Nova senha' : 'Senha provisória'} {!isEditar && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type="password"
                      required={!isEditar}
                      minLength={isEditar ? 0 : 6}
                      value={form.senha}
                      onChange={e => set('senha', e.target.value)}
                      placeholder={isEditar ? 'Deixe em branco para não alterar' : 'Mínimo 6 caracteres'}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      {isEditar ? 'Preencha apenas se quiser redefinir a senha.' : 'O usuário deverá alterar no primeiro acesso.'}
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={fechar}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}>
                      {salvando ? (isEditar ? 'Salvando...' : 'Criando...') : (isEditar ? 'Salvar Alterações' : 'Criar Usuário')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      {/* Audit log */}
      {auditLog.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Histórico de Ações</h2>
          </div>
          <ul className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {auditLog.map((entry, i) => (
              <li key={i} className="px-5 py-2.5 flex items-start gap-3">
                <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5 shrink-0">{entry.ts}</span>
                <span className="text-xs text-gray-600">{entry.msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toast */}
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
