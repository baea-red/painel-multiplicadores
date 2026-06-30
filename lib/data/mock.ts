import type { Roda, Multiplicador, Coordenador, Documento, UsuarioAtual } from '@/lib/types'

export const coordenadores: Coordenador[] = [
  { id: 'c1', nome: 'Ana Paula Ferreira', email: 'ana@gmb.org', regiao: 'Nordeste', estados: ['CE'] },
  { id: 'c2', nome: 'Cristina Alves', email: 'cristina@gmb.org', regiao: 'Sudeste', estados: ['SP'] },
]

export const multiplicadores: Multiplicador[] = [
  {
    id: 'm1', nome: 'Multiplicadora Teste 1', email: 'mult1@example.com', ativo: true,     telefone: '(00) 00001-0001', municipio: 'Fortaleza', estado: 'CE', bairro: 'Aldeota',
    status: 'formado', dataIngresso: '2024-01-12', dataConclusao: '2024-06-15',
    certificadoEmitido: true,
    rodasRealizadas: 7, pessoasImpactadas: 198, municipiosAtendidos: 6,
  },
  {
    id: 'm2', nome: 'Multiplicadora Teste 2', email: 'mult2@example.com', ativo: true, telefone: '(00) 00001-0002', municipio: 'Campinas', estado: 'SP', bairro: 'Centro',
    status: 'em_formacao', dataIngresso: '2024-02-20',
    certificadoEmitido: false,
    rodasRealizadas: 3, pessoasImpactadas: 87, municipiosAtendidos: 2,
  },
  {
    id: 'm3', nome: 'Multiplicadora Teste 3', email: 'mult3@example.com', ativo: true, telefone: '(00) 00001-0003', municipio: 'Salvador', estado: 'BA', bairro: 'Barra',
    status: 'aguardando_validacao', dataIngresso: '2024-02-08',
    certificadoEmitido: false,
    rodasRealizadas: 5, pessoasImpactadas: 197, municipiosAtendidos: 4,
  },
  {
    id: 'm4', nome: 'Multiplicadora Teste 4', email: 'mult4@example.com', ativo: true, telefone: '(00) 00001-0004', municipio: 'Fortaleza', estado: 'CE', bairro: 'Aldeota',
    status: 'em_formacao', dataIngresso: '2024-03-01',
    certificadoEmitido: false,
    rodasRealizadas: 4, pessoasImpactadas: 134, municipiosAtendidos: 1,
  },
  {
    id: 'm5', nome: 'Multiplicadora Teste 5', email: 'mult5@example.com', ativo: true, telefone: '(00) 00001-0005', municipio: 'Fortaleza', estado: 'CE', bairro: 'Aldeota',
    status: 'em_formacao', dataIngresso: '2024-03-01',
    certificadoEmitido: false,
    rodasRealizadas: 2, pessoasImpactadas: 110, municipiosAtendidos: 1,
  },
]

export const rodas: Roda[] = [
  // Ana Lima (m1) — formada, 7 rodas
  {
    id: 'r-al1', nome: 'Roda UBS Aldeota', municipio: 'Fortaleza', estado: 'CE', bairro: 'Aldeota',
    local: 'UBS', tipo: 'em_grupo', dataInicio: '2024-03-10',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm1',
    participantes: 24,
  },
  {
    id: 'r-al2', nome: 'Roda Escola Sobral', municipio: 'Sobral', estado: 'CE', bairro: 'Centro',
    local: 'Escola', tipo: 'individual', dataInicio: '2024-03-18',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm1',
    participantes: 31,
  },
  {
    id: 'r-al3', nome: 'Roda Domicílio JN', municipio: 'Juazeiro do Norte', estado: 'CE', bairro: 'Centro',
    local: 'Domicílio', tipo: 'em_grupo', dataInicio: '2024-04-05',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm1',
    participantes: 19,
  },
  {
    id: 'r-al4', nome: 'Roda Igreja Crato', municipio: 'Crato', estado: 'CE', bairro: 'Centro',
    local: 'Igreja', tipo: 'individual', dataInicio: '2024-04-22',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm1',
    participantes: 27,
  },
  {
    id: 'r-al5', nome: 'Roda UBS Maracanaú', municipio: 'Maracanaú', estado: 'CE', bairro: 'Centro',
    local: 'UBS', tipo: 'em_grupo', dataInicio: '2024-05-10',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm1',
    participantes: 35,
  },
  // Rita Mendes (m3) — aguardando validação
  {
    id: 'r-rm1', nome: 'Roda Salvador Centro', municipio: 'Salvador', estado: 'BA', bairro: 'Barra',
    local: 'UBS', tipo: 'em_grupo', dataInicio: '2024-02-20',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm3',
    participantes: 40,
  },
  {
    id: 'r-rm2', nome: 'Roda Escola Salvador', municipio: 'Salvador', estado: 'BA', bairro: 'Pituba',
    local: 'Escola', tipo: 'individual', dataInicio: '2024-03-15',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm3',
    participantes: 28,
  },
  // Maria das Graças (m4) e Francisca (m5)
  {
    id: 'r1', nome: 'Roda UBS Aldeota', municipio: 'Fortaleza', estado: 'CE', bairro: 'Aldeota',
    local: 'UBS', tipo: 'em_grupo', dataInicio: '2024-03-10',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm4',
    participantes: 24,
  },
  {
    id: 'r2', nome: 'Roda Escola Sobral', municipio: 'Sobral', estado: 'CE', bairro: 'Centro',
    local: 'Escola', tipo: 'individual', dataInicio: '2024-03-18',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm4',
    participantes: 31,
  },
  {
    id: 'r3', nome: 'Roda Domicílio JN', municipio: 'Juazeiro do Norte', estado: 'CE', bairro: 'Centro',
    local: 'Domicílio', tipo: 'em_grupo', dataInicio: '2024-04-05',
    status: 'concluida', coordenadorId: 'c1', multiplicadoraId: 'm4',
    participantes: 19,
  },
  {
    id: 'r4', nome: 'Roda Igreja Crato', municipio: 'Crato', estado: 'CE', bairro: 'Centro',
    local: 'Igreja', tipo: 'individual', dataInicio: '2024-04-22',
    status: 'ativa', coordenadorId: 'c1', multiplicadoraId: 'm5',
    participantes: 27,
  },
  {
    id: 'r5', nome: 'Roda UBS Fortaleza', municipio: 'Fortaleza', estado: 'CE', bairro: 'Pirambu',
    local: 'UBS', tipo: 'em_grupo', dataInicio: '2024-05-10',
    status: 'ativa', coordenadorId: 'c1', multiplicadoraId: 'm5',
    participantes: 35,
  },
]


export const documentos: Documento[] = [
  { id: 'd1', nome: 'Formulário de Inscrição - Aldeota', tipo: 'formulario', url: '#', dataUpload: '2024-03-01' },
  { id: 'd2', nome: 'Registro Roda UBS Aldeota', tipo: 'roda_passada', url: '#', dataUpload: '2024-04-05' },
]

// Usuários demo por perfil
export const usuariosDemo: Record<string, import('@/lib/types').UsuarioAtual> = {
  administrador: {
    id: 'admin1', nome: 'Administrador', email: 'admin@gmb.org', perfil: 'administrador',
  },
  coordenador: {
    id: 'c1', nome: 'Ana Paula Ferreira', email: 'ana@gmb.org', perfil: 'coordenador', coordenadorId: 'c1',
  },
  multiplicadora_formada: {
    id: 'm1', nome: 'Multiplicadora Teste 1', email: 'mult1@example.com', perfil: 'multiplicadora', multiplicadoraId: 'm1',
  },
  multiplicadora_em_formacao: {
    id: 'm4', nome: 'Multiplicadora Teste 4', email: 'mult4@example.com', perfil: 'multiplicadora', multiplicadoraId: 'm4',
  },
  multiplicadora_aguardando: {
    id: 'm3', nome: 'Multiplicadora Teste 3', email: 'mult3@example.com', perfil: 'multiplicadora', multiplicadoraId: 'm3',
  },
}
