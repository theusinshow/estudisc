# Continuidade no Claude Code

Estado verificado em 2026-10-01. Projeto: `C:\Dev\pessoal\vecta`. Remote `origin`: `https://github.com/theusinshow/vecta.git`. Último commit de implementação: `ecdf14d`. A expansão foi construída copiando o KNOW/OS com seu histórico; o original em `C:\Dev\pessoal\know-os` permanece somente leitura. Nenhum push, deploy ou migration de produção foi feito.

## Pedido e decisões do usuário

- Continuar a expansão KNOW/OS para preparação IFSC 2027, seguindo IFSC-00 a IFSC-15.
- Priorizar agilidade e baixo consumo de tokens: checks básicos e focados por alteração; ampliar somente por falha/risco real. Não repetir toda a suíte a cada ajuste.
- **Conteúdo permanece em rascunho para revisão humana.** Não publicar automaticamente, fabricar QA independente ou contornar a proibição de autoaprovação.
- Trabalhar no vecta; não modificar o checkout original. Push, publicação, deploy e migrations reais exigem autorização explícita.

Leia primeiro `AGENTS.md`, `AUTONOMY.md`, `PROJECT_STATUS.md`, este resumo e `docs/ifsc/LOCAL-DELIVERY.md`. Para critérios específicos, consulte `docs/ifsc/16-IMPLEMENTATION-PLAN.md`, `17-ACCEPTANCE-CRITERIA.md` e `IMPLEMENTATION-AUDIT.md`. As seções antigas de V1 são histórico, não o estado atual do vecta. A declaração antiga de V1 publicado não significa que este novo repo foi publicado.

## Implementado localmente

Next.js 16.3.6, React 19, TypeScript strict, Drizzle/PostgreSQL, Zod, Vitest e Playwright. Monólito modular: reutilizar renderer, registries, imports, Attempts, evidence, mastery, review, auth e gateway existentes.

- Pack v1 preservado; Pack v2 validado/importado transacionalmente, com fontes, requisitos, pré-requisitos e versões imutáveis.
- Interações educacionais com teclado/toque, quatro Golden Lessons (MAT-07, POR-01, CIE-06, GH-06) e mini-aula de pré-requisitos matemáticos.
- Questions compartilhadas, avaliação no servidor, respostas protegidas, hints/exposição persistidos; Attempts imutáveis e evidências append-only.
- Perfis privados ADMIN/STUDENT; políticas determinísticas `mastery.v2`/`review.v2`; planner com orçamento/pré-requisitos/áreas; StudySessions congeladas e retomáveis.
- Motor único de assessments: versões/ordem/prazo congelados, respostas editáveis até finalizar, finalização idempotente e evidência uma única vez. Simulados completos: 28 questões, sete por área, quatro horas.
- Originais PNG privados com autorização; questões reservadas fora do treino; anulações não pontuam nem geram evidência.
- Admin mínimo com preview, cobertura, QA e ações JSON; quatro camadas independentes de QA, publicação/retirada; GenerationJobs v2 via fluxo manual Admin. O endpoint legado de geração direta aceita somente v1.
- Tutor opcional pelo gateway existente, contexto reduzido e exposição registrada; bloqueado em EXAM. Não houve chamada real ao provedor.
- Navegação mobile, isolamento de owners e proteção de mutações contra origem externa.

Migrations `0010`–`0017` em `src/db/migrations`, com metadados Drizzle, exercitadas em PGlite descartável. Nenhum banco persistente foi migrado nesta expansão.

## Conteúdo e arquivos privados

Inventário: **27 requisitos propostos do Anexo V, 378 Concepts, 68 registros de Lesson, 141 Questions (29 Golden + 112 oficiais) e 12 templates de assessment em rascunho**. **63 Lessons ainda não têm ensino/prática/exit ticket.** Mapear requisitos não significa currículo pronto; todos os conteúdos existentes também precisam de revisão humana.

Quatro provas Integrado: 2025.1/2025.2/2026.1/2026.2. Q15 de 2025.1 anulada; 56 questões de 2026 reservadas. OCR de 2025.2, ordem do texto, estímulos, classificação e descrições acessíveis ainda exigem conferência. Não declarar aceite completo nem cobertura aprovada.

Fontes privadas ignoradas: `sources/ifsc`, `sources/ifsc/historical`, `ifsc-source/know-os-ifsc-spec-v1-final`. Artefatos ignorados em `.local/ifsc-official`: `bank.draft.json`, `track.source-pack.v2.json`, `coverage.inventory.json`, `assessment-templates.draft.json` e PNGs originais. Não mover material protegido para `public` ou Git.

Builders: `scripts/ingest-ifsc-official.py`, `ocr-ifsc-pdf-pages.ps1`, `build-ifsc-source-pack.py`, `build-ifsc-assessments.mjs`, `build-ifsc-golden-seed.mjs`. Datas/duração configuráveis em `packs/seeds/ifsc-2027.exam-settings.json`; seed Golden versionado em `packs/seeds/ifsc-2027.golden.track.v2.json`.

## Rodar e testar no Windows

As dependências já estão instaladas. O PowerShell do usuário **não encontra pnpm**, embora o ambiente do Codex o encontre. Para abrir o app sem instalar nada:

```powershell
cd C:\Dev\pessoal\vecta
$env:DATABASE_URL="memory://local"
$env:KNOW_OS_OWNER_ID="local-owner"
node .\node_modules\next\dist\bin\next dev
```

Abrir `http://localhost:3000`. Memory é harness temporário, começa sem conteúdo importado, perde dados ao reiniciar e é proibido em produção. Admin local pode importar/visualizar rascunhos; isso não aprova conteúdo para alunos. PostgreSQL/OAuth precisam de configuração para operação persistente; nenhuma credencial foi copiada.

Para disponibilizar o pnpm já existente **somente no terminal atual**:

```powershell
$env:PATH="C:\Users\matheus.mendes\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback;$env:PATH"
pnpm typecheck
pnpm lint
# Escolher testes relevantes à alteração, por exemplo:
pnpm exec vitest run tests/unit/generation-contracts.test.ts
```

Última validação: suíte completa com **134 testes / 60 arquivos aprovados**, um teste de PostgreSQL real pulado; mais oito testes focados de geração e cinco checks mobile. Build, lint, tipos e auditoria de dependências de produção passaram. São resultados da entrega anterior, não substituir uma nova validação das mudanças futuras.

E2E básico (servidor próprio na porta 3210; fixtures simulam publicação apenas no harness):

```powershell
pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/percentage-study.spec.ts --project=mobile-chrome
```

Não usar `npm install` para recriar dependências: preservar `pnpm-lock.yaml`. `next-env.d.ts` mudou após o usuário iniciar `next dev` (referências `.next/dev/types`); é arquivo gerado, não uma alteração de funcionalidade. Conferir `git status` antes de editar e preservar alterações do usuário.

## Próximo trabalho e limites

Começar verificando o fluxo local de importação/preview e preparando um banco **local descartável** se persistência for necessária. Avançar na produção das 63 aulas em rascunho e revisão humana das fontes, sem liberar conteúdo automaticamente. O aceite depende de QA independente, referências válidas, exit tickets publicados e pelo menos duas Questions de treino publicadas por Concept.

Outras lacunas: Admin com filtros/gestão de alunos/analytics limitado; restauração completa de assessments/assets ainda incompleta; tutor sem validação real/controles operacionais; falta E2E completo do assessment e observação real de produção. Para localizar código: `src/features/{curriculum,questions,study-sessions,assessments,content-qa,mastery,review,generation}` e `src/db/repositories`.

Não criar motores paralelos, não usar IA para decidir domínio/planner/nota, não transformar conclusão de Lesson em mastery e não reescrever versões históricas. Documentar lacunas e atualizar status/changelog conforme o trabalho avançar.
