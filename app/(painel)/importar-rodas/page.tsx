'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useMultiplicadores } from '@/lib/context/multiplicadoras-context'
import { usePerfil } from '@/lib/context/perfil-context'
import { coordenadores } from '@/lib/data/mock'

// Colunas obrigatórias na planilha
const COLUNAS = ['nome', 'multiplicadora_email', 'municipio', 'estado', 'bairro', 'local', 'tipo', 'data_inicio', 'participantes', 'status', 'coordenador_id']
const COLUNAS_OBRIGATORIAS = ['nome', 'multiplicadora_email', 'municipio', 'estado', 'bairro', 'local', 'tipo', 'data_inicio', 'participantes', 'status']

const TIPOS_VALIDOS = ['em_grupo', 'individual']
const STATUS_VALIDOS = ['ativa', 'concluida', 'pausada']

interface LinhaImportada {
  linha: number
  dados: Record<string, string>
  erros: string[]
  valida: boolean
}

function validarLinha(dados: Record<string, string>, idx: number, emails: Set<string>, estadosPermitidos: string[] | null): LinhaImportada {
  const erros: string[] = []

  for (const col of COLUNAS_OBRIGATORIAS) {
    if (!dados[col]?.trim()) erros.push(`"${col}" é obrigatório`)
  }

  if (dados.tipo && !TIPOS_VALIDOS.includes(dados.tipo.trim().toLowerCase())) {
    erros.push(`"tipo" deve ser "em_grupo" ou "individual"`)
  }

  if (dados.status && !STATUS_VALIDOS.includes(dados.status.trim().toLowerCase())) {
    erros.push(`"status" deve ser "ativa", "concluida" ou "pausada"`)
  }

  if (dados.participantes && isNaN(Number(dados.participantes))) {
    erros.push(`"participantes" deve ser um número`)
  }

  if (dados.data_inicio) {
    const d = new Date(dados.data_inicio)
    if (isNaN(d.getTime())) erros.push(`"data_inicio" com formato inválido (use AAAA-MM-DD)`)
  }

  if (dados.estado && dados.estado.trim().length !== 2) {
    erros.push(`"estado" deve ser a sigla com 2 letras (ex: CE, SP)`)
  }

  if (estadosPermitidos && dados.estado && !estadosPermitidos.includes(dados.estado.trim().toUpperCase())) {
    erros.push(`"estado" ${dados.estado.trim().toUpperCase()} está fora da sua região de coordenação`)
  }

  if (dados.multiplicadora_email && !emails.has(dados.multiplicadora_email.trim().toLowerCase())) {
    erros.push(`Multiplicadora com e-mail "${dados.multiplicadora_email}" não encontrada`)
  }

  return { linha: idx + 2, dados, erros, valida: erros.length === 0 }
}

export default function ImportarRodasPage() {
  const router = useRouter()
  const { multiplicadores, adicionarRodas } = useMultiplicadores()
  const { usuario } = usePerfil()

  const coordenador = usuario?.perfil === 'coordenador'
    ? coordenadores.find(c => c.id === usuario.coordenadorId)
    : null
  const estadosCoordenador = coordenador?.estados ?? null

  const multsDaRegiao = estadosCoordenador
    ? multiplicadores.filter(m => estadosCoordenador.includes(m.estado))
    : multiplicadores
  const emailsMultiplicadores = new Set(multsDaRegiao.map((m: { email: string }) => m.email.toLowerCase()))

  const [etapa, setEtapa] = useState<'upload' | 'revisao' | 'concluido'>('upload')
  const [linhas, setLinhas] = useState<LinhaImportada[]>([])
  const [arrastando, setArrastando] = useState(false)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!usuario || (usuario.perfil !== 'administrador' && usuario.perfil !== 'coordenador')) {
    return (
      <div className="p-10 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold text-gray-700">Acesso restrito.</p>
        <p className="text-sm text-muted-foreground mt-1">Apenas coordenadores e administradores podem importar rodas em massa.</p>
      </div>
    )
  }

  const validas = linhas.filter(l => l.valida)
  const invalidas = linhas.filter(l => !l.valida)

  function baixarModelo() {
    const modelo = [
      COLUNAS,
      ['Roda Exemplo 1', 'exemplo1@example.com', 'Fortaleza', 'CE', 'Centro', 'Centro Comunitário', 'em_grupo', '2024-01-15', '25', 'concluida', ''],
      ['Roda Exemplo 2', 'exemplo2@example.com', 'Campinas', 'SP', 'Aldeota', 'UBS Local', 'em_grupo', '2024-02-10', '18', 'concluida', 'c1'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(modelo)
    ws['!cols'] = COLUNAS.map(() => ({ wch: 22 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rodas')
    XLSX.writeFile(wb, 'modelo_importacao_rodas.xlsx')
  }

  function processarArquivo(file: File) {
    setNomeArquivo(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })

      const resultado = rows.map((row, i) => {
        const normalizado: Record<string, string> = {}
        for (const key of Object.keys(row)) {
          normalizado[key.trim().toLowerCase().replace(/\s+/g, '_')] = String(row[key])
        }
        return validarLinha(normalizado, i, emailsMultiplicadores, estadosCoordenador)
      })

      setLinhas(resultado)
      setEtapa('revisao')
    }
    reader.readAsArrayBuffer(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setArrastando(false)
    const file = e.dataTransfer.files[0]
    if (file) processarArquivo(file)
  }

  function confirmarImportacao() {
    const novasRodas = validas.map((l, i) => {
      const mult = multiplicadores.find(m => m.email.toLowerCase() === l.dados.multiplicadora_email?.trim().toLowerCase())
      return {
        id: 'import-' + Date.now() + '-' + i,
        nome: l.dados.nome,
        municipio: l.dados.municipio,
        estado: l.dados.estado,
        bairro: l.dados.bairro,
        local: l.dados.local,
        tipo: (l.dados.tipo === 'individual' ? 'individual' : 'em_grupo') as 'em_grupo' | 'individual',
        dataInicio: l.dados.data_inicio,
        status: (l.dados.status as import('@/lib/types').StatusRoda),
        coordenadorId: l.dados.coordenador_id?.trim() || '',
        multiplicadoraId: mult?.id ?? '',
        participantes: Number(l.dados.participantes) || 0,
      }
    })
    adicionarRodas(novasRodas, () => setEtapa('concluido'))
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.back()} className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <span>›</span>
        <span className="text-foreground font-medium">Importar Rodas</span>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Importação em Massa de Rodas</h1>
        <p className="text-sm text-muted-foreground mt-1">Cadastre rodas retroativas a partir de uma planilha Excel.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {[
          { key: 'upload', label: 'Upload', n: 1 },
          { key: 'revisao', label: 'Revisão', n: 2 },
          { key: 'concluido', label: 'Concluído', n: 3 },
        ].map(({ key, label, n }, i) => {
          const ativo = etapa === key
          const feito = (etapa === 'revisao' && n < 2) || (etapa === 'concluido' && n < 3)
          return (
            <div key={key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${feito ? 'bg-green-500 text-white' : ativo ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                  style={ativo ? { background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' } : {}}>
                  {feito ? '✓' : n}
                </div>
                <span className={`text-xs mt-1 font-medium ${ativo ? 'text-primary' : feito ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`h-0.5 flex-1 mb-4 transition-colors ${feito ? 'bg-green-400' : 'bg-gray-100'}`} />}
            </div>
          )
        })}
      </div>

      {/* Etapa 1: Upload */}
      {etapa === 'upload' && (
        <div className="space-y-4">
          {/* Baixar modelo */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-800">1. Baixe o modelo de planilha</p>
              <p className="text-sm text-gray-500 mt-0.5">Preencha com os dados das rodas a serem cadastradas.</p>
            </div>
            <button
              onClick={baixarModelo}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border-2 transition-colors shrink-0"
              style={{ color: '#7B1FA2', borderColor: '#7B1FA2' }}
            >
              <Download className="w-4 h-4" />
              Baixar Modelo
            </button>
          </div>

          {/* Upload */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="font-semibold text-gray-800 mb-3">2. Faça o upload da planilha preenchida</p>
            <div
              onDragOver={e => { e.preventDefault(); setArrastando(true) }}
              onDragLeave={() => setArrastando(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${arrastando ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/30'}`}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
                <Upload className="w-6 h-6" style={{ color: '#E91E8C' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-sm text-gray-400 mt-1">Formatos aceitos: .xlsx, .xls, .csv</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) processarArquivo(f) }}
              />
            </div>
          </div>

          {/* Colunas esperadas */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="font-semibold text-gray-800 mb-3">Colunas esperadas na planilha</p>
            <div className="flex flex-wrap gap-2">
              {COLUNAS.map(col => (
                <span key={col} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">{col}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Todos os campos são obrigatórios. <strong>tipo</strong>: em_grupo ou individual. <strong>status</strong>: ativa, concluida ou pausada. <strong>data_inicio</strong>: AAAA-MM-DD.</p>
          </div>
        </div>
      )}

      {/* Etapa 2: Revisão */}
      {etapa === 'revisao' && (
        <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total de linhas', val: linhas.length, cor: '#7B1FA2', bg: '#f5f3ff' },
              { label: 'Válidas', val: validas.length, cor: '#2E7D32', bg: '#f0fdf4' },
              { label: 'Com erro', val: invalidas.length, cor: invalidas.length > 0 ? '#D32F2F' : '#9ca3af', bg: invalidas.length > 0 ? '#fff5f5' : '#f9fafb' },
            ].map(({ label, val, cor, bg }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm p-4 text-center" style={{ borderTop: `3px solid ${cor}` }}>
                <p className="text-3xl font-heading font-bold" style={{ color: cor }}>{val}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500">Arquivo: <strong className="text-gray-700">{nomeArquivo}</strong></p>

          {/* Linhas com erro */}
          {invalidas.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-gray-800">Linhas com inconsistências ({invalidas.length})</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {invalidas.map(l => (
                  <div key={l.linha} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 mt-0.5">Linha {l.linha}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{l.dados.nome || '(sem nome)'}</p>
                        <ul className="mt-1 space-y-0.5">
                          {l.erros.map((e, i) => (
                            <li key={i} className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linhas válidas */}
          {validas.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <h2 className="font-semibold text-gray-800">Rodas prontas para cadastro ({validas.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Linha', 'Nome', 'Multiplicadora', 'Município', 'Data', 'Participantes', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validas.map(l => (
                      <tr key={l.linha} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs text-gray-400">{l.linha}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{l.dados.nome}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{l.dados.multiplicadora_email}</td>
                        <td className="px-4 py-3 text-gray-600">{l.dados.municipio} · {l.dados.estado}</td>
                        <td className="px-4 py-3 text-gray-500">{l.dados.data_inicio}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: '#E91E8C' }}>{l.dados.participantes}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            l.dados.status === 'concluida' ? 'bg-blue-100 text-blue-700' :
                            l.dados.status === 'ativa' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {l.dados.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => { setEtapa('upload'); setLinhas([]) }}
              className="text-sm px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={confirmarImportacao}
              disabled={validas.length === 0}
              className="text-sm px-6 py-2.5 rounded-xl font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' }}
            >
              Cadastrar {validas.length} roda{validas.length !== 1 ? 's' : ''} válida{validas.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Etapa 3: Concluído */}
      {etapa === 'concluido' && (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="font-heading font-bold text-xl text-gray-900">
            {validas.length} roda{validas.length !== 1 ? 's' : ''} cadastrada{validas.length !== 1 ? 's' : ''} com sucesso!
          </h2>
          {invalidas.length > 0 && (
            <p className="text-sm text-gray-500">
              {invalidas.length} linha{invalidas.length !== 1 ? 's' : ''} com inconsistência{invalidas.length !== 1 ? 's' : ''} não {invalidas.length !== 1 ? 'foram importadas' : 'foi importada'}. Corrija e importe novamente.
            </p>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => { setEtapa('upload'); setLinhas([]) }}
              className="text-sm px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Nova importação
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm px-6 py-2.5 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#E91E8C,#7B1FA2)' }}
            >
              Ir para o Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
