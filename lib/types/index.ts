export type Perfil = 'publico' | 'multiplicadora' | 'coordenador' | 'administrador'

export type StatusMultiplicador = 'em_formacao' | 'aguardando_validacao' | 'formado' | 'inativo'
export type StatusRoda = 'ativa' | 'concluida' | 'pausada'

export interface Municipio {
  id: number
  nome: string
}

export interface Bairro {
  id: number
  nome: string
  municipioId: number
}

export interface Roda {
  id: string
  nome: string
  municipio: string
  estado: string
  bairro: string
  local: string
  tipo: 'em_grupo' | 'individual'
  dataInicio: string
  dataFim?: string
  status: StatusRoda
  coordenadorId: string
  multiplicadoraId: string
  participantes: number
  fotos?: string[]
  frequencia?: string
}

export interface Multiplicador {
  id: string
  nome: string
  email: string
  telefone: string
  ativo: boolean
  municipio: string
  estado: string
  bairro: string
  status: StatusMultiplicador
  dataIngresso: string
  dataConclusao?: string
  certificadoEmitido: boolean
  rodasRealizadas: number
  pessoasImpactadas: number
  municipiosAtendidos: number
  minimoRodasContratado?: number
}

export interface Coordenador {
  id: string
  nome: string
  email: string
  regiao: string
  estados: string[]
}

export interface UsuarioAtual {
  id: string
  nome: string
  email: string
  perfil: Perfil
  multiplicadoraId?: string
  coordenadorId?: string
}

export interface KPIsNacional {
  totalMultiplicadores: number
  emFormacaoPratica: number
  aguardandoValidacao: number
  formadas: number
  rodasRealizadas: number
  pessoasImpactadas: number
  estadosAtendidos: number
  municipiosAtendidos: number
}

export interface ConfiguracaoEstado {
  estado: string
  minimoRodas: number
}

export interface Documento {
  id: string
  nome: string
  tipo: 'formulario' | 'roda_passada' | 'outro'
  url: string
  dataUpload: string
  rodaId?: string
  multiplicadorId?: string
}
