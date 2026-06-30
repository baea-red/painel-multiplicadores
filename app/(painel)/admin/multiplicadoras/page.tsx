'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import type { StatusMultiplicador, Multiplicador } from '@/lib/types'
import { MultiplicadoraDrawer } from '@/components/dashboard/multiplicadora-drawer'
import { usePagination } from '@/lib/hooks/use-pagination'
import { Pagination } from '@/components/ui/pagination'

const statusLabel: Record<StatusMultiplicador, string> = {
  formado: 'Formado',
  em_formacao: 'Em Prática',
  aguardando_validacao: 'Aguardando',
  inativo: 'Inativo',
}
const statusColor: Record<StatusMultiplicador, string> = {
  formado: 'bg-green-100 text-green-700',
  em_formacao: 'bg-blue-100 text-blue-700',
  aguardando_validacao: 'bg-yellow-100 text-yellow-700',
  inativo: 'bg-gray-100 text-gray-500',
}

export default function AdminMultiplicadoresPage() {
  const router = useRouter()
  const { multiplicadores } = useMultiplicadores()
  const { usuario } = usePerfil()

  if (usuario && usuario.perfil !== 'administrador' && usuario.perfil !== 'coordenador') {
    return (
      <div className="p-10 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold text-gray-700">Acesso restrito.</p>
        <p className="text-sm text-muted-foreground mt-1">Esta página é exclusiva para coordenadores e administradores.</p>
      </div>
    )
  }

  const podeAprovar = usuario?.perfil === 'administrador' || usuario?.perfil === 'coordenador'
  const [busca, setBusca] = useState('')
  const [drawer, setDrawer] = useState<Multiplicador | null>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'erro' } | null>(null)

  function showToast(msg: string, tipo: 'ok' | 'erro' = 'ok') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 5000)
  }
  const [estado, setEstado] = useState('Todos')
  const [status, setStatus] = useState('Todos')

  const filtradas = multiplicadores.filter(m => {
    const matchBusca = !busca || m.nome.toLowerCase().includes(busca.toLowerCase()) || m.email.toLowerCase().includes(busca.toLowerCase())
    const matchEstado = estado === 'Todos' || m.estado === estado
    const matchStatus = status === 'Todos' || m.status === status
    return matchBusca && matchEstado && matchStatus
  })

  const { paginated, page, pageSize, totalPages, total, changePage, changePageSize } = usePagination(filtradas)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Gestão de Multiplicadores</h1>
        <p className="text-sm text-muted-foreground">{filtradas.length} multiplicadores cadastrados</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Buscar</label>
            <input type="text" value={busca} onChange={e => { setBusca(e.target.value); changePage(1) }} placeholder="Nome ou e-mail..."
              className="w-full border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Estado</label>
            <select value={estado} onChange={e => { setEstado(e.target.value); changePage(1) }}
              className="w-full border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option>Todos</option>
              {[...new Set(multiplicadores.map(m => m.estado))].map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value); changePage(1) }}
              className="w-full border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option>Todos</option>
              <option value="formado">Formado</option>
              <option value="em_formacao">Em Prática</option>
              <option value="aguardando_validacao">Aguardando</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filtradas.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-semibold text-gray-600">Nenhuma multiplicadora encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca.</p>
          </div>
        )}
        {/* Desktop: tabela */}
        {filtradas.length > 0 && <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Nome', 'Estado', 'Município', 'Status', 'Rodas', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                        {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{m.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.estado}</td>
                  <td className="px-4 py-3 text-gray-500">{m.municipio}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColor[m.status]}`}>
                      {statusLabel[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#E91E8C' }}>{m.rodasRealizadas}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(m.dataIngresso).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setDrawer(m)} className="text-xs font-medium border rounded-full px-2.5 py-1 hover:bg-pink-50 transition-colors whitespace-nowrap" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>Ver</button>
                      <button onClick={() => router.push(`/admin/multiplicadoras/${m.id}?editar=true`)} className="text-xs font-medium border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-50 transition-colors text-gray-500">✏️</button>
                      {m.status === 'aguardando_validacao' && podeAprovar && (
                        <button onClick={() => router.push(`/admin/multiplicadoras/${m.id}?tab=certificacao`)} className="flex items-center gap-1 text-xs font-semibold text-white rounded-full px-2.5 py-1 hover:opacity-90 transition-opacity whitespace-nowrap" style={{ background: '#2E7D32' }}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Validar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        {/* Mobile: cards */}
        {filtradas.length > 0 && <div className="md:hidden divide-y divide-gray-50">
          {paginated.map(m => (
            <div key={m.id} className="px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#E91E8C' }}>
                {m.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{m.nome}</p>
                <p className="text-xs text-gray-400 truncate">{m.municipio} · {m.estado}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${statusColor[m.status]}`}>{statusLabel[m.status]}</span>
                  <span className="text-xs font-semibold" style={{ color: '#E91E8C' }}>{m.rodasRealizadas} rodas</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => setDrawer(m)} className="text-xs font-medium border rounded-full px-3 py-1 hover:bg-pink-50 transition-colors" style={{ color: '#E91E8C', borderColor: '#E91E8C' }}>Ver</button>
                {m.status === 'aguardando_validacao' && podeAprovar && (
                  <button onClick={() => router.push(`/admin/multiplicadoras/${m.id}?tab=certificacao`)} className="text-xs font-semibold text-white rounded-full px-3 py-1 hover:opacity-90 transition-opacity" style={{ background: '#2E7D32' }}>Validar</button>
                )}
              </div>
            </div>
          ))}
        </div>}

        {filtradas.length > 0 && <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={changePage} onPageSize={changePageSize} />}
      </div>

      <MultiplicadoraDrawer mult={drawer} onClose={() => setDrawer(null)} onToast={showToast} />

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
