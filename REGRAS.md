# Regras de Negócio — Painel Multiplicadoras (GMB)

## 1. Perfis e Permissões

O sistema possui quatro perfis, definidos em `lib/types/index.ts`:

```
Perfil = 'publico' | 'multiplicadora' | 'coordenador' | 'administrador'
```

### 1.1 Multiplicadora
- Acessa apenas seu próprio perfil e rodas.
- Vinculada a um único estado e município.
- Pode solicitar validação de formação quando elegível.
- Pode baixar certificado após ser aprovada.

### 1.2 Coordenador
- Responsável (`coordenadorId`) por cada roda registrada.
- Pode ser vinculado a múltiplos estados (array `estados[]`).
- **Exclusivo:** aprova ou reprova multiplicadoras aguardando validação (Validação → fila de pendentes).

### 1.3 Administrador
- Acesso total ao painel: KPIs nacionais, gestão de usuários.
- Pode ser vinculado a múltiplos estados.
- **Exclusivo:** define e altera o número mínimo de rodas por estado (Configurações → Regras de Formação).

### 1.4 Regras gerais
- O **perfil é imutável** após a criação do usuário.
- Senha provisória obrigatória na criação (mínimo 6 caracteres); opcional na edição.

---

## 2. Ciclo de Vida da Multiplicadora

```
em_formacao → aguardando_validacao → formado
                                   ↘ inativo
```

| Transição | Quem aciona | Condição |
|-----------|-------------|----------|
| `em_formacao` → `aguardando_validacao` | Multiplicadora | ≥ 5 rodas realizadas |
| `aguardando_validacao` → `formado` | Coordenador | Aprovação na fila |
| `aguardando_validacao` → `inativo` | Coordenador | Reprovação na fila |

> Não há fluxo de reativação implementado para o status `inativo`.

---

## 3. Rodas

### 3.1 Conceito
- **Cada roda é um encontro** — não há sub-encontros dentro de uma roda.
- Uma roda representa uma sessão realizada pela multiplicadora com um grupo de participantes.

### 3.2 Status
```
StatusRoda = 'ativa' | 'concluida' | 'pausada'
```

### 3.3 Estrutura
Campos obrigatórios: `id`, `nome`, `municipio`, `estado`, `bairro`, `local`, `tipo`, `dataInicio`, `status`, `coordenadorId`, `multiplicadoraId`, `participantes`.

Campo opcional: `dataFim` (preenchido quando concluída).

### 3.4 Tipos de roda
```
tipo: 'em_grupo' | 'individual'
```

### 3.5 Vinculação
- Cada roda pertence a exatamente **uma multiplicadora** e a exatamente **um coordenador**.

---

## 4. Formação

### 4.1 Requisito mínimo
- O número mínimo de rodas é **configurável por estado**, administrado exclusivamente pelo perfil **Administrador** em Configurações → Regras de Formação.
- O valor padrão é **5 rodas** para estados sem configuração específica.
- O progresso é calculado como `rodasRealizadas / minimoRodas(estado)` (limitado a 100%).

### 4.2 Solicitação de validação
- O botão "Solicitar Validação" aparece quando:
  - `rodasRealizadas >= minimoRodas(estado)` **E**
  - `status === 'em_formacao'`
- Após solicitar, o status muda para `aguardando_validacao` e nenhuma nova ação está disponível para a multiplicadora.

### 4.3 Certificado
- Desbloqueado apenas quando `status === 'formado'`.
- O campo `dataConclusao` é exibido no certificado quando disponível.

---

## 5. Estrutura Geográfica

### 5.1 Hierarquia
**Estado → Município → Bairro**

- Multiplicadoras e rodas armazenam `estado`, `municipio` e `bairro` como strings (não como IDs de referência).

### 5.2 Cobertura por perfil
- **Multiplicadora**: 1 estado + 1 município.
- **Coordenador / Administrador**: múltiplos estados (array).

### 5.3 Estados disponíveis
O sistema suporta todos os **27 estados** brasileiros (26 UFs + DF).

---

## 6. Métricas e KPIs

### 6.1 KPIs individuais (multiplicadora)
- `rodasRealizadas`: total de rodas realizadas.
- `pessoasImpactadas`: total de participantes somados das rodas.
- `municipiosAtendidos`: número de municípios distintos onde realizou rodas.

### 6.2 KPIs nacionais (administrador)
- Total de multiplicadoras por status (`em_formacao`, `aguardando_validacao`, `formado`).
- Total de rodas, pessoas impactadas, estados e municípios atendidos.

---

## 7. Autenticação e Sessão

- Sessão persiste em `localStorage` (chave: `gmb_usuario_key`).
- Login por e-mail (case-insensitive, com trim) + senha (case-sensitive).
- Logout limpa o `localStorage` e reseta o estado.

---

## 8. Gestão de Usuários (Administrador)

### 8.1 Diferenças de formulário por perfil

| Campo | Multiplicadora | Coordenador | Administrador |
|-------|---------------|-------------|---------------|
| Estado único | Sim | Não | Não |
| Município | Sim | Não | Não |
| Múltiplos estados | Não | Sim | Sim |

### 8.2 Ações disponíveis
- Criar, editar, ativar e desativar usuários de qualquer perfil.
- O perfil **não pode ser alterado** após a criação.
