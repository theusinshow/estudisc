# Prompt Mestre — Codex

Você está trabalhando no Estudisc.

Leia integralmente:

1. `00_README_CODEX.md`
2. `01_PRODUCT_ARCHITECTURE.md`
3. `03_IMPLEMENTATION_GAP_ANALYSIS_TEMPLATE.md`
4. `04_IMPLEMENTATION_PLAN_TEMPLATE.md`
5. `05_INTERACTIVE_LEARNING.md`
6. `06_LESSON_BLUEPRINT_PIPELINE.md`
7. `07_AI_LEARNING_LAYER.md`
8. `08_DESIGN_SYSTEM_EVOLUTION.md`
9. `09_ACCEPTANCE_AND_QA.md`
10. `10_EXECUTION_CHECKLIST.md`

## Objetivo

Transformar a arquitetura aprovada do Estudisc em uma implementação incremental, segura, mobile-first e testável.

## Regra essencial

NÃO comece implementando todas as features.

Primeiro faça auditoria completa do estado atual do repositório contra os documentos.

Crie:

```text
docs/estudisc/IMPLEMENTATION-GAP-ANALYSIS.md
docs/estudisc/IMPLEMENTATION-PLAN.md
```

Use os templates fornecidos.

## Classificação de gaps

Para cada requisito:

```text
EXISTS
PARTIAL
MISSING
NEEDS_REFACTOR
DEFERRED
```

Inclua evidência por arquivo/componente.

## Depois da auditoria

Construa um plano em fases.

Não pule para fases futuras apenas porque são mais interessantes.

## Ordem

### Phase 0 — Stabilization

Garanta:
- lint;
- typecheck;
- tests;
- build;
- E2E crítico;
- source of truth coerente;
- Design System version canônica.

### Phase 1 — Design Foundation

Implementar apenas fundação:
- shell;
- TopBar;
- BottomNavigation;
- tokens;
- responsive layout;
- registry;
- motion;
- accessibility.

### Phase 2 — Today

Nova Home mobile-first.

### Phase 3 — Planner

Study Planning System.

### Phase 4 — Adaptive Session

Compositor determinístico.

### Phase 5 — Lesson Architecture

LessonStep + LearningBlock Registry.

### Phase 6 — Core Interactive Blocks

Primeiros blocos reutilizáveis.

### Phase 7 — Visual Asset System

Asset Registry.

### Phase 8 — Blueprint Pipeline

Auditar todas as aulas, SEM migração automática em massa.

### Phase 9 — Content Enrichment

Somente após revisão dos blueprints.

Depois seguir as fases restantes.

## Não reescrever

Não trocar:
- Next.js;
- React;
- Drizzle;
- Neon;
- Auth.js;
- stack de deploy;
- arquitetura inteira.

## Não quebrar

Preservar:
- conteúdo;
- IDs;
- versões;
- questions;
- attempts;
- evidence;
- mastery;
- sessions;
- imports;
- exports;
- hashes;
- auth;
- histórico editorial.

## IA

IA é contextual.

Nunca usar IA como autoridade sobre:
- mastery;
- planner;
- spaced repetition;
- simulado;
- evidência;
- publicação.

## Mobile-first

Toda nova UI deve ser validada primeiro em largura ~390px.

Não considerar desktop como fonte primária.

## Component sourcing

Antes de criar novo componente:

1. procurar no Component Registry;
2. procurar na foundation do projeto;
3. verificar shadcn/primitives/Motion;
4. verificar fontes especializadas;
5. só então criar novo.

Não importar identidade visual de biblioteca externa.

## Qualidade

Ao final de cada fase:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Executar E2E crítico quando a fase afetar fluxo de usuário.

## Documentação

Atualizar `IMPLEMENTATION-PLAN.md` à medida que executar.

Registrar decisões relevantes em ADR.

## Saída inicial obrigatória

Antes de alterar a arquitetura principal, entregue:

1. `IMPLEMENTATION-GAP-ANALYSIS.md`
2. `IMPLEMENTATION-PLAN.md`
3. lista de riscos;
4. primeiras migrations necessárias;
5. components/primitives que podem ser reutilizados;
6. confirmação de quais fases já existem parcialmente.

Somente então prossiga para implementação incremental.
