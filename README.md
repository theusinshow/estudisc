# KNOW/OS

## Expansão IFSC 2027

O roadmap IFSC estende o núcleo existente com currículo rastreável, Question Bank, sessões e planner determinístico, assessments, QA e tutor opcional. Perfis privados ADMIN/STUDENT mantêm estado separado. Especificação: [docs/ifsc/README.md](docs/ifsc/README.md); progresso atual em PROJECT_STATUS.md. A implementação está em andamento; recursos planejados não são apresentados como concluídos. Design System v3 evolui os tokens canônicos; v1 e o Programming Lab permanecem suportados.

**Personal Learning Operating System**

KNOW/OS é um sistema pessoal para estruturar aprendizado, prática, revisão e aplicação em projetos reais. A primeira extensão de domínio é programação, começando por JavaScript, mas o núcleo é agnóstico de assunto.

## Estado do projeto

- Fase atual: **V1 publicado em produção com Neon Postgres, Vercel e Auth.js Google OAuth; Pack exemplo ativado e gamificação persistida como projeção auditável**.
- Design System oficial: `design-system/`, versão 3.0 (delta IFSC integrado; tokens históricos preservados).
- Implementação: Next.js App Router com TypeScript strict, Tailwind, token pipeline, shell acessível, fundação Drizzle/PostgreSQL, Zod, Vitest, Testing Library, Playwright e CI.
- V1 local implementado e verificado: importar conteúdo por `/import`, navegar por trilhas/lições/conceitos, executar JavaScript com RUN, registrar tentativa com SUBMIT SOLUTION, reabrir feedback persistido, ver progresso, histórico, contrato de runtime, stdout/stderr/testes, diff da tentativa, atividade inicial de debug, mastery determinístico, agenda de review, erros categorizados, projetos opcionais, XP/ranks/badges/missões com projeção persistida, mapa de conhecimento acessível, recomendações locais, preview de import/export/restore, exports Backup/Progress/Teacher Context, auditoria de acessibilidade e preparação de segurança/deploy local.
- Modo de execução do Codex: **autonomia elevada com limites de repositório**.

## Desenvolvimento local

Pré-requisitos descobertos durante Phase 0:

- Node.js `24.14.0`
- pnpm `11.9.0`

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

O app local usa o padrão do Next.js em `http://localhost:3000`. Os testes Playwright usam `http://127.0.0.1:3210` com servidor próprio e execução serial para evitar conflito com outros servidores locais e com o harness descartável `memory://local`.

## Comandos canônicos

```text
pnpm install --frozen-lockfile
pnpm dev
pnpm generate:tokens
pnpm lint
pnpm typecheck
pnpm test
pnpm test:postgres
pnpm test:e2e
pnpm security:audit
pnpm build
pnpm db:generate
```

`pnpm generate:tokens` lê `design-system/design-tokens.json` e atualiza `src/styles/generated/design-tokens.css`. O arquivo gerado é versionado e não deve ser editado manualmente.

## Banco de dados

Phase 1 adiciona o schema mínimo PostgreSQL/Drizzle do vertical slice. Configure `DATABASE_URL` localmente usando `.env.example` como referência; credenciais reais não devem ser commitadas.

O endpoint de desenvolvimento `GET /api/health/db` retorna:

- `ok` quando a conexão responde;
- `not_configured` quando `DATABASE_URL` está ausente;
- `unavailable` quando a conexão falha, sem expor detalhes sensíveis.

Para testes locais sem PostgreSQL externo:

- Vitest usa PGlite em memória para validar repositórios Drizzle e a migration gerada.
- Playwright usa `DATABASE_URL=memory://local` como harness descartável de UI porque PGlite não empacota de forma confiável no servidor Next dev.

Esse modo não substitui PostgreSQL de produção.

Para validar um PostgreSQL real sem tocar nas tabelas da aplicação:

```powershell
pnpm test:postgres
```

O comando lê `TEST_DATABASE_URL` ou `DATABASE_URL` do ambiente ou do `.env.local` ignorado pelo Git, cria um schema descartável `know_os_real_pg_*`, aplica as migrations nele, roda importação/RUN/SUBMIT/progresso e remove apenas esse schema ao final. Durante essa validação isolada, referências de FK geradas como `"public".*` são reescopadas para o schema descartável; `pnpm db:migrate` continua sendo o caminho para aplicar as migrations reais no schema `public` do alvo escolhido.

## Produção planejada

ADR 0015 define a stack de preparação para produção:

- Vercel para hosting.
- Neon Postgres para `DATABASE_URL`.
- Auth.js com Google OAuth.
- Allowlist inicial por e-mail em `KNOW_OS_ALLOWED_GOOGLE_EMAILS`.
- Tela própria em `/auth/signin`, seguindo o Design System, com Google OAuth configurado para seleção explícita de conta.

Variáveis esperadas para produção:

```text
DATABASE_URL
APP_URL
AUTH_SECRET
AUTH_TRUST_HOST
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
KNOW_OS_ALLOWED_GOOGLE_EMAILS
KNOW_OS_OWNER_ID
LOG_LEVEL
```

O callback Google OAuth deve terminar em `/api/auth/callback/google`, por exemplo `https://seu-dominio/api/auth/callback/google`. Em Vercel, `AUTH_TRUST_HOST=true` mantém o Auth.js confiando nos headers encaminhados pelo proxy. Não commite valores reais de OAuth, banco ou `AUTH_SECRET`.

## Segurança de publicação

`pnpm security:audit` roda `pnpm audit --prod --audit-level moderate` e bloqueia vulnerabilidades conhecidas em dependências de produção. Overrides compatíveis ficam em `pnpm-workspace.yaml` para `sharp`, `postcss`, `esbuild` e `brace-expansion` transitivos. A auditoria completa de desenvolvimento ainda pode sinalizar o caminho dev-only `eslint -> minimatch@3 -> brace-expansion`; `brace-expansion@1.1.18` é usado para manter compatibilidade sem quebrar o ESLint.

As respostas de runtime passam por `src/proxy.ts` e incluem CSP em modo enforcement com nonce por requisição, além de `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` e `Permissions-Policy`. Em produção, `script-src` não usa `unsafe-inline` nem `unsafe-eval`; o `unsafe-eval` fica restrito ao servidor local de desenvolvimento do Next.js.

## Vertical slice

Com um banco migrado ou com o harness Playwright:

1. `/import` carrega o Pack exemplo ou aceita JSON colado/selecionado, executa preview e aplica o Track Pack válido.
2. `/tracks` lista trilhas importadas.
3. `/lessons/js-fundamentals-001` abre a atividade de código.
4. `RUN` executa sem registrar Attempt.
5. `SUBMIT SOLUTION` registra Attempt, resultados de teste, progresso simples, diff de tentativa e StudyEvent.
6. A lição reabre a última tentativa persistida com stdout/stderr e resultados de teste.
7. A mesma lição inclui uma atividade de debug que reutiliza o runtime isolado por meio do registro de atividades.
8. `/tracks/javascript` e `/lessons/js-fundamentals-001` mostram progresso de navegação sem declarar mastery de conceitos.
9. `/concepts/js-logical-and` mostra mastery calculado por `mastery.v1` a partir de evidência.
10. `/review` mostra revisões vencidas pela política `review.v1`.
11. `/mistakes` mostra erros categorizados e preserva erros resolvidos.
12. `/projects` mostra contextos opcionais que vinculam conceitos e atividades importadas sem substituir o fluxo principal.
13. `/progress` mostra XP append-only e transações auditáveis.
14. `/achievements` mostra rank, badges e missões derivadas por regras transparentes, com timestamps persistidos de award/progresso quando disponíveis.
15. `/knowledge-map` lista conceitos importados com relações de lições/trilhas sem depender de canvas.
16. `/` recomenda a próxima ação por regras determinísticas: review, erro ativo, continuidade e aplicação em projeto.
17. `/history` mostra eventos como `activity_submitted` e `review_completed`.
18. `/exports` mostra previews de Backup, Progress e Teacher Context com categorias, avisos de privacidade e restore preview bloqueado para estado do usuário.

## Portabilidade e segurança V1

- `POST /api/import/track/preview` valida e resume um Track Pack antes de mutação.
- `POST /api/import/track` aplica limite de tamanho, validação e conflito por hash de conteúdo.
- `GET /api/import/track/example` entrega o Pack exemplo versionado para ativação inicial pela UI protegida.
- `GET /api/export/preview` e `GET /api/export` produzem contratos JSON `know-os.export.v1`.
- `POST /api/restore/preview` valida Backups, lista categorias e inclui o plano `user_state_dry_run` bloqueado para replay seguro futuro. A página `/exports` expõe esse dry-run sem botão de apply para estado do usuário.
- `POST /api/restore` aplica manifests de Pack de forma não destrutiva. O Backup preserva categorias de estado do usuário, mas ADR 0014 deixa replay/merge de estado append-only fora do restore V1; ADR 0016 define a política exigida antes de um futuro restore completo.
- Respostas incluem headers básicos: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` e `Permissions-Policy`.
- Deployment público usa a decisão de ADR 0015: Google OAuth com allowlist de e-mail para o proprietário inicial, Neon Postgres e Vercel. Rotas privadas exigem sessão permitida; APIs privadas retornam `401` sem sessão.

## Começando com Codex

1. Leia `START-HERE.md`.
2. Confirme permissões automatizadas limitadas ao workspace usando `/permissions`.
3. Cole `PROMPT-CODEX-START.md` no Codex.

```powershell
cd C:\Dev\pessoal\know-os
codex
```

O prompt inicial autoriza o agente a avançar fase por fase pelo V1, desde que cada gate passe. Ele não autoriza pushes, deploys, publicação, compras, acesso a segredos reais, operações destrutivas em dados externos ou expansão de escopo.

Se uma sessão for interrompida, use `PROMPT-CODEX-RESUME.md`.

## Autonomia

`AUTONOMY.md` define:

- ações locais autorizadas;
- ações que exigem confirmação;
- ciclo planejar–implementar–validar–corrigir–continuar;
- gates por fase;
- política de decisão sob ambiguidade;
- checkpoints locais;
- recuperação após interrupções;
- condições objetivas de parada.

A autonomia reduz pedidos de confirmação, mas não remove planejamento, testes, documentação, segurança ou controle de escopo.

## Fontes de verdade

1. Regras permanentes de agentes: `AGENTS.md`.
2. Protocolo de autonomia: `AUTONOMY.md`.
3. Produto e escopo: `docs/`.
4. Decisões arquiteturais: `docs/ADR/`.
5. Design visual e interação: `design-system/DESIGN_SYSTEM_INDEX.md`.
6. Plano e estado atuais: `PLANS.md` e `PROJECT_STATUS.md`.

## Estrutura

```text
know-os/
├── AGENTS.md
├── AUTONOMY.md
├── PROMPT-CODEX-START.md
├── PROMPT-CODEX-RESUME.md
├── PLANS.md
├── docs/
├── design-system/
├── packs/
├── public/branding/
├── src/
├── tests/
├── scripts/
├── package.json
└── pnpm-lock.yaml
```

Consulte `docs/21-REPOSITORY-STRUCTURE.md` para a estrutura planejada após o scaffold.
