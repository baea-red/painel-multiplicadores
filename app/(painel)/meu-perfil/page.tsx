'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { usePerfil } from '@/lib/context/perfil-context'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { PainelDocumentos } from '@/components/documentos/painel-documentos'

const BotaoCertificado = dynamic(
  () => import('@/components/certificados/certificado-pdf').then(m => m.BotaoCertificado),
  { ssr: false, loading: () => <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-full" /> }
)

type Tab = 'dados' | 'historico' | 'certificacao' | 'documentos' | 'privacidade'

export default function MeuPerfilPage() {
  const { usuario } = usePerfil()
  const { multiplicadores, solicitarValidacao, getMinimoRodas, rodas, atualizarMultiplicadora } = useMultiplicadores()
  const mult = multiplicadores.find(m => m.id === usuario?.multiplicadoraId)
  const [tab, setTab] = useState<Tab>('dados')
  const [solicitando, setSolicitando] = useState(false)
  const [solicitacaoEnviada, setSolicitacaoEnviada] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editandoDados, setEditandoDados] = useState(false)
  const [formDados, setFormDados] = useState({ nome: mult?.nome ?? '', email: mult?.email ?? '', telefone: mult?.telefone ?? '' })

  const minhasRodas = rodas.filter(r => r.multiplicadoraId === mult?.id)
  const rodasConcluidas = minhasRodas.filter(r => r.status === 'concluida')
  const rodasRealizadas = rodasConcluidas.length
  const municipiosAtendidos = new Set(rodasConcluidas.map(r => r.municipio)).size
  const pessoasImpactadas = rodasConcluidas.reduce((sum, r) => sum + r.participantes, 0)

  if (!mult) {
    return (
      <div className="p-6 text-center space-y-2">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <p className="text-xs text-gray-400">Faça login novamente para continuar.</p>
      </div>
    )
  }

  const minimoRodas = getMinimoRodas(mult.estado, mult)

  function exportarDados() {
    if (!mult) return
    const dados = {
      exportadoEm: new Date().toISOString(),
      nome: mult.nome,
      email: mult.email,
      telefone: mult.telefone,
      municipio: mult.municipio,
      estado: mult.estado,
      bairro: mult.bairro,
      status: mult.status,
      dataIngresso: mult.dataIngresso,
      dataConclusao: mult.dataConclusao ?? null,
      rodasRealizadas,
      pessoasImpactadas,
    }
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meus-dados-gmb-${mult.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSolicitarValidacao() {
    if (!mult) return
    setSolicitando(true)
    solicitarValidacao(mult.id, () => {
      setSolicitando(false)
      setToast('Solicitação de validação enviada com sucesso!')
      setTimeout(() => setToast(null), 3500)
    })
  }

  function handleSalvarDados() {
    if (!mult) return
    atualizarMultiplicadora(mult.id, formDados, () => {
      setEditandoDados(false)
      setToast('Dados atualizados com sucesso!')
      setTimeout(() => setToast(null), 3500)
    })
  }

  return (
    <div className="p-4 sm:p-6">
      <nav className="text-xs text-muted-foreground mb-4">
        <span>Dashboard</span> <span className="mx-1">›</span>
        <span className="text-foreground font-medium">Meu Perfil</span>
      </nav>

      {/* Layout: stack no mobile, side-by-side no desktop */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
        {/* Sidebar */}
        <div className="w-full lg:w-56 bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto"
              style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
            >
              {mult.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <h2 className="font-heading font-bold text-base mt-3">{mult.nome}</h2>
            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${
              mult.status === 'formado' ? 'bg-green-100 text-green-700' :
              mult.status === 'aguardando_validacao' ? 'bg-yellow-100 text-yellow-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {mult.status === 'formado' ? 'Formado' :
               mult.status === 'aguardando_validacao' ? 'Aguard. Validação' : 'Em Prática'}
            </span>
            <p className="text-xs text-muted-foreground mt-2">📍 {mult.municipio} · {mult.estado}</p>
            <p className="text-xs text-muted-foreground">
              Cadastrada em {new Date(mult.dataIngresso).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="border-t border-gray-100 pt-4 grid grid-cols-3 lg:grid-cols-1 gap-2">
            {[
              { label: 'Rodas realizadas', valor: rodasRealizadas },
              { label: 'Municípios', valor: municipiosAtendidos },
              { label: 'Pessoas impactadas', valor: pessoasImpactadas },
            ].map(({ label, valor }) => (
              <div key={label} className="flex lg:flex-row flex-col lg:items-center lg:justify-between text-sm">
                <span className="text-gray-500 text-xs">{label}</span>
                <span className="font-bold text-base lg:text-sm" style={{ color: '#E91E8C' }}>{valor}</span>
              </div>
            ))}
          </div>

          {/* Botão Solicitar Validação */}
          {rodasRealizadas >= minimoRodas && mult.status === 'em_formacao' && (
            <button
              onClick={handleSolicitarValidacao}
              disabled={solicitando}
              aria-label="Solicitar validação de formação"
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}
            >
              {solicitando ? '⏳ Enviando...' : '✅ Solicitar Validação'}
            </button>
          )}
          {mult.status === 'aguardando_validacao' && (
            <div className="w-full py-2.5 rounded-xl text-xs font-semibold text-yellow-700 bg-yellow-50 text-center border border-yellow-200">
              ⏳ Aguardando validação do coordenador
            </div>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs — scroll horizontal no mobile */}
          <div role="tablist" className="flex border-b border-gray-100 px-4 sm:px-6 overflow-x-auto">
            {([['dados', 'Dados Pessoais'], ['historico', 'Histórico de Rodas'], ['certificacao', 'Certificação'], ['documentos', 'Documentos'], ['privacidade', '🔒 Privacidade']] as [Tab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                className={`py-4 mr-4 sm:mr-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {tab === 'dados' && (
              <div role="tabpanel" id="panel-dados" aria-labelledby="tab-dados" className="space-y-4">
                <div className="flex justify-end gap-2">
                  {editandoDados ? (
                    <>
                      <button onClick={() => setEditandoDados(false)} className="text-sm border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 text-gray-500">Cancelar</button>
                      <button onClick={handleSalvarDados} className="text-sm rounded-full px-4 py-1.5 font-semibold text-white" style={{ background: 'linear-gradient(135deg, #E91E8C, #7B1FA2)' }}>💾 Salvar</button>
                    </>
                  ) : (
                    <button aria-label="Editar dados pessoais" onClick={() => { setFormDados({ nome: mult.nome, email: mult.email, telefone: mult.telefone }); setEditandoDados(true) }} className="text-sm border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50">✏️ Editar</button>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Nome Completo</label>
                  {editandoDados
                    ? <input value={formDados.nome} onChange={e => setFormDados(f => ({ ...f, nome: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                    : <div aria-readonly="true" className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50">{mult.nome}</div>
                  }
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">E-mail</label>
                    {editandoDados
                      ? <input type="email" value={formDados.email} onChange={e => setFormDados(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                      : <div aria-readonly="true" className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 truncate">{mult.email}</div>
                    }
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Telefone</label>
                    {editandoDados
                      ? <input value={formDados.telefone} onChange={e => setFormDados(f => ({ ...f, telefone: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                      : <div aria-readonly="true" className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50">{mult.telefone}</div>
                    }
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Estado</label>
                    <div aria-readonly="true" className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50">{mult.estado}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Município</label>
                    <div aria-readonly="true" className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50">{mult.municipio}</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'historico' && (() => {
              const minhasRodas = rodas.filter(r => r.multiplicadoraId === mult.id)
              return (
                <div role="tabpanel" id="panel-historico" aria-labelledby="tab-historico" className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-2">{minhasRodas.length} rodas registradas</p>
                  {minhasRodas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma roda registrada.</p>
                  ) : minhasRodas.map(roda => (
                    <div key={roda.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#E91E8C' }} />
                        <div>
                          <p className="text-sm font-medium">{roda.nome} — {roda.municipio}</p>
                          <p className="text-xs text-muted-foreground">{new Date(roda.dataInicio).toLocaleDateString('pt-BR')} · {roda.participantes} participantes</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        roda.status === 'concluida' ? 'bg-green-100 text-green-700' :
                        roda.status === 'ativa' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{roda.status === 'concluida' ? 'Registrada' : roda.status === 'ativa' ? 'Em andamento' : 'Pausada'}</span>
                    </div>
                  ))}
                </div>
              )
            })()}

            {tab === 'documentos' && (
              <div role="tabpanel" id="panel-documentos" aria-labelledby="tab-documentos">
                <PainelDocumentos />
              </div>
            )}

            {tab === 'privacidade' && (
              <div role="tabpanel" id="panel-privacidade" aria-labelledby="tab-privacidade" className="space-y-6">
                <div>
                  <h3 className="font-heading font-semibold text-base mb-1">Seus dados armazenados</h3>
                  <p className="text-xs text-muted-foreground mb-4">Conforme Art. 18 da LGPD, você tem direito de acessar, corrigir e solicitar a exclusão dos seus dados pessoais.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {[
                      ['Nome', mult.nome],
                      ['E-mail', mult.email],
                      ['Telefone', mult.telefone],
                      ['Município', mult.municipio],
                      ['Estado', mult.estado],
                      ['Bairro', mult.bairro],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-0.5">{label}</span>
                        <span className="text-gray-800 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <h3 className="font-heading font-semibold text-base">Portabilidade de dados</h3>
                  <p className="text-xs text-muted-foreground">Baixe uma cópia de todos os seus dados em formato JSON (Art. 18, V — LGPD).</p>
                  <button
                    onClick={exportarDados}
                    aria-label="Exportar todos os meus dados em formato JSON"
                    className="flex items-center gap-2 text-sm font-semibold border rounded-xl px-5 py-2.5 hover:bg-pink-50 transition-colors"
                    style={{ color: '#E91E8C', borderColor: '#E91E8C' }}
                  >
                    ⬇️ Exportar meus dados (.json)
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <h3 className="font-heading font-semibold text-base">Correção ou exclusão</h3>
                  <p className="text-xs text-muted-foreground">Para solicitar correção de dados incorretos ou exclusão da sua conta, envie uma solicitação (Art. 18, III e VI — LGPD). A resposta será enviada em até 15 dias úteis.</p>
                  {solicitacaoEnviada ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                      ✅ Solicitação registrada. Entraremos em contato em breve.
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSolicitacaoEnviada(true); setToast('Solicitação registrada. Entraremos em contato em até 15 dias úteis.'); setTimeout(() => setToast(null), 4000) }}
                      className="flex items-center gap-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl px-5 py-2.5 transition-colors text-gray-700"
                    >
                      ✏️ Solicitar correção / exclusão
                    </button>
                  )}
                </div>
              </div>
            )}

            {tab === 'certificacao' && (
              <div role="tabpanel" id="panel-certificacao" aria-labelledby="tab-certificacao" className="text-center py-6 sm:py-8 space-y-4">
                {mult.status === 'formado' ? (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl sm:text-4xl">🏅</div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl">Parabéns, {mult.nome.split(' ')[0]}!</h3>
                    <p className="text-sm text-muted-foreground">Você concluiu a formação com sucesso.</p>
                    {mult.dataConclusao && (
                      <p className="text-sm text-muted-foreground">
                        Concluído em: <span className="font-medium text-foreground">{new Date(mult.dataConclusao).toLocaleDateString('pt-BR')}</span>
                      </p>
                    )}
                    <BotaoCertificado multiplicador={mult} />
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl sm:text-4xl">🎓</div>
                    <h3 className="font-heading font-bold text-lg text-gray-600">Certificado em breve</h3>
                    <p className="text-sm text-muted-foreground">Complete as {minimoRodas} rodas obrigatórias para desbloquear.</p>
                    {minhasRodas.length > rodasRealizadas && (
                      <p className="text-xs text-gray-400">
                        💡 {minhasRodas.length - rodasRealizadas} roda(s) em andamento — marque como <strong>Registrada</strong> no detalhe para contabilizar.
                      </p>
                    )}
                    <div className="max-w-xs mx-auto">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progresso</span><span>{rodasRealizadas}/{minimoRodas}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          role="progressbar"
                          aria-valuenow={rodasRealizadas}
                          aria-valuemin={0}
                          aria-valuemax={minimoRodas}
                          aria-label="Progresso de rodas realizadas"
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, (rodasRealizadas / minimoRodas) * 100)}%`, background: 'linear-gradient(90deg, #E91E8C, #7B1FA2)' }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div role="alert" aria-live="assertive" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-2" style={{ background: '#2E7D32' }}>
          ✓ {toast}
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
