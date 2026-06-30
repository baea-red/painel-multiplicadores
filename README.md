# Painel Multiplicadoras — Grupo Mulheres do Brasil (GMB)

Painel de gestão para o programa de multiplicadoras do GMB. Permite acompanhar o ciclo de formação das multiplicadoras, gerenciar rodas de conversa e emitir certificados.

---

## Tecnologias

- **Next.js 16** (App Router)
- **React 19** (Context API com nova sintaxe `<Context value={...}>`)
- **Tailwind CSS**
- **TypeScript**
- **SheetJS (xlsx)** — importação de planilhas Excel

---

## Iniciar o projeto

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Perfis de acesso

| Perfil | Acesso |
|--------|--------|
| **Multiplicadora** | Próprio perfil, rodas e certificado |
| **Coordenador** | Dashboard regional, validação de formação, importação em massa de rodas |
| **Administrador** | Acesso total, gestão de usuários, configuração de regras por estado |

### Usuários de teste

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@gmb.org | admin123 |
| Coordenadora | ana@gmb.org | coord123 |
| Multiplicadora (formada) | ana.lima@email.com | mult123 |
| Multiplicadora (em prática) | maria@email.com | mult123 |

---

## Funcionalidades por perfil

### Multiplicadora
- Dashboard com progresso de formação, rodas recentes e KPIs pessoais
- Lista de rodas com detalhe de cada roda
- Perfil pessoal com botão "Solicitar Validação" (disponível ao atingir o mínimo de rodas do estado)
- Download de certificado em PDF após aprovação

### Coordenador
- Dashboard regional com KPIs por estado/município
- Mapa de estados e municípios com detalhamento por bairro
- **Fila de validação**: aprova ou reprova multiplicadoras aguardando formação
- **Importação em massa de rodas** via planilha Excel (`.xlsx`, `.xls`, `.csv`)
- Edição de dados de multiplicadoras e rodas

### Administrador
- Dashboard nacional com KPIs agregados
- Gestão de usuários (multiplicadoras, coordenadores, administradores)
- **Configurações → Regras de Formação**: define o mínimo de rodas por estado
- Relatórios

---

## Fluxo de formação

```
em_formacao → aguardando_validacao → formado
                                   ↘ inativo
```

| Transição | Quem aciona | Condição |
|-----------|-------------|----------|
| `em_formacao` → `aguardando_validacao` | Multiplicadora | ≥ mínimo de rodas do estado |
| `aguardando_validacao` → `formado` | **Coordenador** | Aprovação na fila de validação |
| `aguardando_validacao` → `inativo` | **Coordenador** | Reprovação na fila de validação |

> O número mínimo de rodas é **configurável por estado** pelo Administrador (padrão: 5 rodas).

---

## Importação em massa de rodas

Acesso: **Coordenador → Importar Rodas**

**Fluxo:**
1. Download do modelo Excel com exemplos
2. Preenchimento da planilha
3. Upload do arquivo
4. Revisão: sistema valida cada linha e exibe inconsistências detalhadas
5. Confirmação: apenas as linhas válidas são cadastradas

**Colunas obrigatórias:**

| Coluna | Descrição |
|--------|-----------|
| `nome` | Nome da roda |
| `multiplicadora_email` | E-mail da multiplicadora responsável |
| `municipio` | Município onde ocorreu |
| `estado` | Sigla do estado (2 letras, ex: CE) |
| `bairro` | Bairro |
| `local` | Local de realização |
| `tipo` | `em_grupo` ou `individual` |
| `data_inicio` | Data no formato `AAAA-MM-DD` |
| `participantes` | Número de participantes |
| `status` | `ativa`, `concluida` ou `pausada` |

**Validações aplicadas:**
- Campos obrigatórios presentes
- `tipo` e `status` com valores permitidos
- `participantes` numérico
- `data_inicio` com formato de data válido
- `estado` com exatamente 2 caracteres
- E-mail da multiplicadora deve existir no sistema

---

## Estrutura de rotas

```
/                          → Página pública (landing)
/entrar                    → Login
/mapa                      → Mapa público de rodas

/dashboard                 → Dashboard (varia por perfil)
/minhas-rodas              → Lista de rodas (multiplicadora)
/minhas-rodas/[id]         → Detalhe de roda
/meu-perfil                → Perfil da multiplicadora
/certificados/[id]         → Certificado

/municipios                → Estados e municípios (coordenador)
/municipios/[estado]/[municipio] → Detalhamento por município
/validacao                 → Fila de validação (coordenador)
/importar-rodas            → Importação em massa (coordenador)
/relatorios                → Relatórios

/admin/multiplicadoras     → Gestão de multiplicadoras (admin)
/admin/multiplicadoras/[id] → Perfil completo com edição
/admin/configuracoes       → Usuários + Regras de Formação (admin)
```

---

## Observações sobre o protótipo

- O estado da aplicação é **em memória** (React Context + mock data). Alterações são perdidas ao recarregar a página.
- A importação de rodas valida e exibe as linhas, mas não persiste em banco de dados neste protótipo.
- Para produção, substituir os mocks em `lib/data/mock.ts` por chamadas à API.
- Regras de negócio completas documentadas em [`REGRAS.md`](./REGRAS.md).
