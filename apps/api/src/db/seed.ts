import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmb.org' },
    update: {},
    create: {
      nome: 'Administrador Nacional',
      email: 'admin@gmb.org',
      senhaHash: await bcrypt.hash('admin123', 12),
      perfil: 'administrador',
      estados: [],
    },
  })

  // Coordinators
  const coordAna = await prisma.user.upsert({
    where: { email: 'ana@gmb.org' },
    update: {},
    create: {
      nome: 'Ana Paula Ferreira',
      email: 'ana@gmb.org',
      senhaHash: await bcrypt.hash('coord123', 12),
      perfil: 'coordenador',
      estados: ['CE'],
      regiao: 'Nordeste',
      coordenador: { create: { regiao: 'Nordeste' } },
    },
    include: { coordenador: true },
  })

  const coordCristina = await prisma.user.upsert({
    where: { email: 'cristina@gmb.org' },
    update: {},
    create: {
      nome: 'Cristina Alves',
      email: 'cristina@gmb.org',
      senhaHash: await bcrypt.hash('coord123', 12),
      perfil: 'coordenador',
      estados: ['SP'],
      regiao: 'Sudeste',
      coordenador: { create: { regiao: 'Sudeste' } },
    },
    include: { coordenador: true },
  })

  const coordBahia = await prisma.user.upsert({
    where: { email: 'marcia@gmb.org' },
    update: {},
    create: {
      nome: 'Márcia Oliveira',
      email: 'marcia@gmb.org',
      senhaHash: await bcrypt.hash('coord123', 12),
      perfil: 'coordenador',
      estados: ['BA'],
      regiao: 'Nordeste',
      coordenador: { create: { regiao: 'Nordeste' } },
    },
    include: { coordenador: true },
  })

  await prisma.configuracaoEstado.upsert({
    where: { estado: 'BA' },
    update: {},
    create: { estado: 'BA', minimoRodas: 5 },
  })

  // Multiplicadores
  const mult1 = await prisma.user.upsert({
    where: { email: 'mult1@example.com' },
    update: {},
    create: {
      nome: 'Multiplicadora Teste 1',
      email: 'mult1@example.com',
      senhaHash: await bcrypt.hash('mult123', 12),
      perfil: 'multiplicadora',
      telefone: '(00) 00001-0001',
      estado: 'CE',
      municipio: 'Fortaleza',
      bairro: 'Aldeota',
      multiplicadora: {
        create: {
          status: 'formado',
          dataIngresso: new Date('2024-01-12'),
          dataConclusao: new Date('2024-06-15'),
          certificadoEmitido: true,
          rodasRealizadas: 7,
          pessoasImpactadas: 198,
          municipiosAtendidos: 6,
          coordenadorId: coordAna.coordenador?.id,
        },
      },
    },
    include: { multiplicadora: true },
  })

  const mult3 = await prisma.user.upsert({
    where: { email: 'mult3@example.com' },
    update: {},
    create: {
      nome: 'Multiplicadora Teste 3',
      email: 'mult3@example.com',
      senhaHash: await bcrypt.hash('mult123', 12),
      perfil: 'multiplicadora',
      telefone: '(00) 00001-0003',
      estado: 'BA',
      municipio: 'Salvador',
      bairro: 'Barra',
      multiplicadora: {
        create: {
          status: 'aguardando_validacao',
          dataIngresso: new Date('2024-02-08'),
          rodasRealizadas: 5,
          pessoasImpactadas: 197,
          municipiosAtendidos: 4,
          coordenadorId: coordBahia.coordenador?.id,
        },
      },
    },
    include: { multiplicadora: true },
  })

  const mult4 = await prisma.user.upsert({
    where: { email: 'mult4@example.com' },
    update: {},
    create: {
      nome: 'Multiplicadora Teste 4',
      email: 'mult4@example.com',
      senhaHash: await bcrypt.hash('mult123', 12),
      perfil: 'multiplicadora',
      telefone: '(00) 00001-0004',
      estado: 'CE',
      municipio: 'Fortaleza',
      bairro: 'Aldeota',
      multiplicadora: {
        create: {
          status: 'em_formacao',
          dataIngresso: new Date('2024-03-01'),
          rodasRealizadas: 4,
          pessoasImpactadas: 134,
          municipiosAtendidos: 1,
          coordenadorId: coordAna.coordenador?.id,
        },
      },
    },
    include: { multiplicadora: true },
  })

  // Configuracoes por estado
  await prisma.configuracaoEstado.upsert({
    where: { estado: 'CE' },
    update: {},
    create: { estado: 'CE', minimoRodas: 5 },
  })
  await prisma.configuracaoEstado.upsert({
    where: { estado: 'SP' },
    update: {},
    create: { estado: 'SP', minimoRodas: 5 },
  })

  console.log('✅ Seed concluído!')
  console.log('Credenciais de acesso:')
  console.log('  Admin:        admin@gmb.org / admin123')
  console.log('  Coord CE:     ana@gmb.org / coord123')
  console.log('  Coord SP:     cristina@gmb.org / coord123')
  console.log('  Coord BA:     marcia@gmb.org / coord123')
  console.log('  Mult 1 (CE):  mult1@example.com / mult123 (formada)')
  console.log('  Mult 3 (BA):  mult3@example.com / mult123 (aguardando validação)')
  console.log('  Mult 4 (CE):  mult4@example.com / mult123 (em formação)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
