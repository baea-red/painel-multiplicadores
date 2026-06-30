import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

export const CriarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  perfil: z.enum(['multiplicadora', 'coordenador', 'administrador']),
  senhaProvisoria: z.string().min(6, 'Mínimo 6 caracteres'),
  telefone: z.string().optional(),
  estado: z.string().optional(),
  municipio: z.string().optional(),
  bairro: z.string().optional(),
  estados: z.array(z.string()).optional(),
  regiao: z.string().optional(),
})

export const CriarRodaSchema = z.object({
  nome: z.string().min(2),
  municipio: z.string().min(2),
  estado: z.string().length(2),
  bairro: z.string().min(2),
  local: z.string().min(2),
  tipo: z.enum(['em_grupo', 'individual']),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  participantes: z.number().int().min(0),
  coordenadorId: z.string(),
  multiplicadoraId: z.string(),
})

export const AtualizarRodaSchema = CriarRodaSchema.partial().extend({
  status: z.enum(['ativa', 'concluida', 'pausada']).optional(),
})

export const ConfiguracaoEstadoSchema = z.object({
  minimoRodas: z.number().int().min(1).max(50),
})

export const ImportarRodasSchema = z.array(CriarRodaSchema)

export const SolicitacaoLGPDSchema = z.object({
  tipo: z.enum(['exclusao', 'correcao']),
  descricao: z.string().optional(),
})
