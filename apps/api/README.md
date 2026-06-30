# GMB API

Backend REST para o Painel Multiplicadoras — Grupo Mulheres do Brasil.

**Stack:** Hono · Prisma · PostgreSQL · JWT · Zod

---

## Setup rápido

```bash
# 1. Instalar dependências (na raiz do monorepo)
pnpm install

# 2. Configurar variáveis de ambiente
cp apps/api/.env.example apps/api/.env
# Edite DATABASE_URL e JWT_SECRET

# 3. Criar banco e aplicar migrações
cd apps/api
pnpm db:migrate

# 4. Popular com dados de teste
pnpm db:seed

# 5. Iniciar servidor de desenvolvimento
pnpm dev
# → API disponível em http://localhost:3001/api
```

---

## Endpoints

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | /api/auth/login | público | Login |
| GET | /api/auth/me | qualquer | Usuário atual |
| GET | /api/multiplicadoras | todos | Listagem (filtrada por perfil) |
| POST | /api/multiplicadoras/:id/solicitar-validacao | multiplicadora | Solicitar validação |
| POST | /api/multiplicadoras/:id/ativar | admin | Ativar conta |
| POST | /api/multiplicadoras/:id/desativar | admin | Desativar conta |
| GET | /api/rodas | todos | Listagem (filtrada por perfil) |
| POST | /api/rodas | coord / admin | Criar roda |
| PUT | /api/rodas/:id | coord / admin | Editar roda |
| POST | /api/rodas/importar | coord / admin | Importação em lote |
| GET | /api/validacao | coord / admin | Fila de pendentes |
| POST | /api/validacao/:id/aprovar | **coord** | Aprovar (§1.2) |
| POST | /api/validacao/:id/reprovar | **coord** | Reprovar (§1.2) |
| GET | /api/configuracoes | todos | Mínimo de rodas por estado |
| PUT | /api/configuracoes/:estado | **admin** | Alterar mínimo (§1.3) |
| GET | /api/usuarios | admin | Listar usuários |
| POST | /api/usuarios | admin | Criar usuário |
| POST | /api/usuarios/:id/ativar | admin | Ativar |
| POST | /api/usuarios/:id/desativar | admin | Desativar |
| GET | /api/lgpd/exportar | qualquer | Exportar dados (Art. 18) |
| POST | /api/lgpd/solicitar | qualquer | Solicitar exclusão/correção |

---

## Variáveis de ambiente

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| DATABASE_URL | postgresql://... | Conexão PostgreSQL |
| JWT_SECRET | random-32-chars | Segredo JWT (mín. 32 chars) |
| JWT_EXPIRES_IN | 7d | Expiração do token |
| PORT | 3001 | Porta HTTP |
| FRONTEND_URL | http://localhost:3000 | Origem CORS |
