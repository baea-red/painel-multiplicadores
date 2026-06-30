'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, Download, File } from 'lucide-react'
import type { Documento } from '@/lib/types'

const tipoLabel: Record<Documento['tipo'], string> = {
  formulario: 'Formulário',
  roda_passada: 'Roda Passada',
  outro: 'Outro',
}

const tipoColor: Record<Documento['tipo'], string> = {
  formulario: 'bg-blue-100 text-blue-700',
  roda_passada: 'bg-purple-100 text-purple-700',
  outro: 'bg-gray-100 text-gray-600',
}

const LS_KEY = 'gmb_documentos'

export function PainelDocumentos() {
  const [aviso, setAviso] = useState<string | null>(null)
  const [docs, setDocs] = useState<Documento[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      return saved ? (JSON.parse(saved) as Documento[]) : []
    } catch {
      return []
    }
  })
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(docs))
    } catch {
      setAviso('⚠️ Armazenamento local cheio. Alguns documentos podem não ser salvos.')
      setTimeout(() => setAviso(null), 4000)
    }
  }, [docs])

  function handleFiles(files: FileList | null) {
    if (!files) return
    const novos: Documento[] = Array.from(files).map((file, i) => ({
      id: `d${Date.now()}-${i}`,
      nome: file.name,
      tipo: 'outro',
      url: URL.createObjectURL(file),
      dataUpload: new Date().toISOString().split('T')[0],
    }))
    setDocs(prev => [...novos, ...prev])
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={e => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={e => { e.preventDefault(); setArrastando(false); handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
          arrastando ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.png"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${arrastando ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-medium text-foreground">Arraste arquivos ou clique para enviar</p>
        <p className="text-sm text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG — máx. 10MB</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">
            Documentos <span className="text-muted-foreground font-normal text-sm">({docs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {docs.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhum documento enviado ainda
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <File className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${tipoColor[doc.tipo]}`}>
                    {tipoLabel[doc.tipo]}
                  </span>
                  <a
                    href={doc.url}
                    download={doc.nome}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                    onClick={e => e.stopPropagation()}
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {aviso && (
        <div role="alert" aria-live="assertive" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white flex items-center gap-2" style={{ background: '#D32F2F' }}>
          {aviso}
          <button onClick={() => setAviso(null)} aria-label="Fechar aviso" className="text-white/70 hover:text-white transition-colors ml-1">✕</button>
        </div>
      )}
    </div>
  )
}
