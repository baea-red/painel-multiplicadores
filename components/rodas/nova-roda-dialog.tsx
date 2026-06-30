'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import type { Municipio } from '@/lib/types'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'

interface NovaRodaDialogProps {
  open: boolean
  onClose: () => void
  onToast?: (msg: string) => void
}

export function NovaRodaDialog({ open, onClose, onToast }: NovaRodaDialogProps) {
  const { adicionarRodas, multiplicadores } = useMultiplicadores()
  const { usuario } = usePerfil()
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [carregando, setCarregando] = useState(false)
  const [municipioSelecionado, setMunicipioSelecionado] = useState('')
  const [bairro, setBairro] = useState('')
  const [local, setLocal] = useState('')
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<'em_grupo' | 'individual'>('em_grupo')
  const [participantes, setParticipantes] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const mult = multiplicadores.find(m => m.id === usuario?.multiplicadoraId)

  useEffect(() => {
    if (!open || municipios.length > 0 || !mult) return
    setCarregando(true)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${mult.estado}/municipios`)
      .then(r => r.json())
      .then((data: Array<{ id: number; nome: string }>) => {
        setMunicipios(data.map(d => ({ id: d.id, nome: d.nome })))
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [open, municipios.length, mult?.estado])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Informe o nome da roda.'); return }
    if (!municipioSelecionado) { setErro('Selecione um município.'); return }
    if (!bairro.trim()) { setErro('Informe o bairro.'); return }
    if (!mult) return
    setErro(null)
    setEnviando(true)
    adicionarRodas([{
      id: `r${Date.now()}`,
      nome: nome.trim(),
      municipio: municipioSelecionado,
      estado: mult.estado,
      bairro: bairro.trim(),
      local: local.trim() || bairro.trim(),
      tipo,
      dataInicio: dataInicio || new Date().toISOString().split('T')[0],
      status: 'ativa',
      coordenadorId: '',
      multiplicadoraId: mult.id,
      participantes: Number(participantes) || 0,
    }], () => {
      setEnviando(false)
      onToast?.('Roda registrada com sucesso!')
      onClose()
      setNome('')
      setMunicipioSelecionado('')
      setBairro('')
      setLocal('')
      setTipo('em_grupo')
      setParticipantes('')
      setDataInicio('')
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" role="dialog" aria-modal="true" aria-labelledby="nova-roda-dialog-title">
        <DialogHeader>
          <DialogTitle id="nova-roda-dialog-title" className="font-heading">Nova Roda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nova-roda-nome" className="text-sm font-medium text-foreground block mb-1.5">
              Nome da roda
            </label>
            <input
              id="nova-roda-nome"
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Roda Centro Fortaleza"
              required
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="nova-roda-municipio" className="text-sm font-medium text-foreground block mb-1.5">
              Município
            </label>
            {carregando ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando municípios...
              </div>
            ) : (
              <select
                id="nova-roda-municipio"
                value={municipioSelecionado}
                onChange={e => setMunicipioSelecionado(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione um município</option>
                {municipios.map(m => (
                  <option key={m.id} value={m.nome}>{m.nome}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="nova-roda-bairro" className="text-sm font-medium text-foreground block mb-1.5">
              Bairro
            </label>
            <input
              id="nova-roda-bairro"
              type="text"
              value={bairro}
              onChange={e => setBairro(e.target.value)}
              placeholder="Ex: Centro"
              required
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="nova-roda-local" className="text-sm font-medium text-foreground block mb-1.5">
              Local do encontro
            </label>
            <input
              id="nova-roda-local"
              type="text"
              value={local}
              onChange={e => setLocal(e.target.value)}
              placeholder="Ex: UBS, Escola, Igreja..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="nova-roda-data" className="text-sm font-medium text-foreground block mb-1.5">
              Data de início
            </label>
            <input
              id="nova-roda-data"
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="nova-roda-tipo" className="text-sm font-medium text-foreground block mb-1.5">
                Tipo
              </label>
              <select
                id="nova-roda-tipo"
                value={tipo}
                onChange={e => setTipo(e.target.value as 'em_grupo' | 'individual')}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="em_grupo">Em grupo</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div>
              <label htmlFor="nova-roda-participantes" className="text-sm font-medium text-foreground block mb-1.5">
                Participantes
              </label>
              <input
                id="nova-roda-participantes"
                type="number"
                min="0"
                value={participantes}
                onChange={e => setParticipantes(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {erro && (
            <p role="alert" className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠️ {erro}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancelar cadastro"
              className="flex-1 px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              aria-label="Confirmar cadastro de nova roda"
              className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {enviando ? '⏳ Criando...' : 'Criar Roda'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
