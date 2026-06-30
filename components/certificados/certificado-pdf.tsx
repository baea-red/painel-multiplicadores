'use client'

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer'
import type { Multiplicador } from '@/lib/types'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 60,
    fontFamily: 'Helvetica',
  },
  borda: {
    border: '8px solid #E91E8C',
    borderRadius: 12,
    padding: 40,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 11,
    color: '#E91E8C',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  titulo: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1A2E',
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  textoNormal: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 1.8,
    marginBottom: 4,
  },
  nome: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#E91E8C',
    marginVertical: 16,
    textAlign: 'center',
  },
  linha: {
    width: 200,
    height: 2,
    backgroundColor: '#E91E8C',
    marginVertical: 20,
  },
  rodape: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    marginTop: 32,
  },
  data: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
})

interface CertificadoDocumentProps {
  multiplicador: Multiplicador
}

function CertificadoDocument({ multiplicador }: CertificadoDocumentProps) {
  const dataConclusao = multiplicador.dataConclusao
    ? new Date(multiplicador.dataConclusao).toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borda}>
          <Text style={styles.logo}>Grupo Mulheres do Brasil</Text>
          <Text style={styles.titulo}>Certificado de Conclusão</Text>
          <Text style={styles.subtitulo}>Programa de Multiplicadores</Text>

          <View style={styles.linha} />

          <Text style={styles.textoNormal}>Certificamos que</Text>
          <Text style={styles.nome}>{multiplicador.nome}</Text>
          <Text style={styles.textoNormal}>
            concluiu com êxito o Programa de Formação de Multiplicadores
          </Text>
          <Text style={styles.textoNormal}>
            no município de {multiplicador.municipio}, bairro {multiplicador.bairro}.
          </Text>

          <View style={styles.linha} />

          <Text style={styles.data}>Concluído em {dataConclusao}</Text>
          <Text style={styles.rodape}>
            Este certificado atesta a participação e conclusão da formação completa
            com todos os encontros realizados.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

interface BotaoCertificadoProps {
  multiplicador: Multiplicador
}

export function BotaoCertificado({ multiplicador }: BotaoCertificadoProps) {
  return (
    <PDFDownloadLink
      document={<CertificadoDocument multiplicador={multiplicador} />}
      fileName={`certificado-${multiplicador.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Baixar Certificado (PDF)'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
