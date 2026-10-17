# Diagnóstico: revisão, sessões, XP e áreas (Fase 0)

Data: 2026-10-16. Base: `main` em `f41c341`. Evidência de dados: banco de produção (Railway), perfil `account-matheus`, consultas só de leitura.

## 1. `/review` mostra "Nada para revisar" enquanto Hoje mostra "21 erros para retomar"

**As duas telas usam fontes diferentes, e nenhuma está errada isoladamente; juntas, se contradizem.**

| Tela | Fonte | Regra |
|---|---|---|
| Hoje (`src/features/today/today-page.tsx:17`) | tabela `mistakes`, `status = 'active'` | conta linhas |
| `/review` (`src/app/review/page.tsx:29` → `ReviewRepository.listDueReviews`, `src/db/repositories/review-repository.ts:38`) | tabela `review_schedules` | só conceitos com `next_review_at <= now()` |

**Causa raiz A (prazo):** toda resposta de questão passa por `QuestionStudyRepository.submit` (`src/db/repositories/question-study-repository.ts:130–146`). Na primeira vez que um conceito é praticado (`delayedRetrieval = false`), o agendamento é fixo em `now + 1 dia`, **igual para acerto e erro**. Logo, um erro de hoje só vence amanhã e nunca aparece em `/review` no mesmo dia. A política v2 (`review-policy-v2.ts`) só entra quando já existe evidência com mais de 24 h.

**Causa raiz B (contagem):** a mesma transação grava uma linha em `mistakes` **por conceito** da questão errada. Uma questão com dois conceitos gera dois "erros".

**Evidência (produção, `account-matheus`):**

| Medida | Valor |
|---|---|
| Tentativas erradas (`attempts.outcome = 'failed'`) | 16 |
| Linhas em `mistakes` ativas | **21** ("21 erros para retomar") |
| Tentativas distintas por trás dessas linhas | 16 |
| `review_schedules` vencidos agora | **0** ("Nada para revisar") |
| `review_schedules` no futuro | 12 conceitos, o primeiro vence em ~24 h |

**Respostas às hipóteses do pedido:**
- Política v1 × v2: as duas telas não divergem por versão de política; `/review` lê `review_schedules` (gravado como `review.v2`), e Hoje lê `mistakes`.
- `dueAt` no futuro: **sim**, é a causa A.
- Filtro por pack ou matéria: não há.
- Tentativas feitas dentro da aula geram item de revisão? **Sim**: aula e sessão usam o mesmo `QuestionStudyRepository.submit`, que grava `review_schedules` e `mistakes`. O problema é o prazo, não a ausência.

**Direção da correção (Fase 1):** uma única leitura de "erros pendentes" por conceito (agrupando as linhas de `mistakes` por `concept_id`, ou por tentativa, conforme a política documentada), usada por Hoje, `/review`, "Revisar agora" e Progresso; e um erro deve deixar o conceito disponível para revisão no mesmo dia (por exemplo, `next_review_at = now` para erro), mantendo +1 dia para acerto. Os dados antigos se resolvem lendo `mistakes` (sem reescrever), ou com backfill idempotente de `review_schedules.next_review_at` para conceitos com erro ativo.

## 2. "Praticar outra questão" num erro de Ciências abriu Matemática no passo 4

**Causa raiz: a sessão antiga é devolvida no lugar da nova.** `POST /api/study-sessions` com `action: "practice_mistake"` chama `StudySessionRepository.plan(..., { kind: "remediation", mistakeId })` (`src/app/api/study-sessions/route.ts:24`). Em `src/db/repositories/study-session-repository.ts:28–30`, a seleção dirigida (`sqlTargetedSelection`) é calculada, mas logo em seguida:

```ts
const [open] = await tx.select().from(studySessions).where(and(eq(studySessions.ownerId, ownerId), eq(studySessions.status, "ACTIVE")));
if (open) return open;
```

Qualquer sessão `ACTIVE` é devolvida, de qualquer matéria, com o estado salvo (passo, resposta marcada, solução aberta). O seletor de questão filtra corretamente; o resultado dele é descartado.

**Evidência:** `account-matheus` tem uma sessão `ACTIVE` criada em **2026-10-04** com `MAT-12` (polinômios), nunca encerrada. É a sessão que abriu.

**Direção da correção (Fase 1):** para pedidos dirigidos (`remediation`, `review`), não reaproveitar a sessão ativa em silêncio. Oferecer "Continuar a sessão em andamento" ou "Começar nova", encerrando a antiga como `ABANDONED` só com a escolha do aluno; a nova sessão começa no passo 1, sem resposta e sem solução.

## 3. XP "0/100" e dias estudados diferentes entre Hoje e Progresso

**XP:** a soma está certa. `account-matheus` tem 5 transações `question_independent_success` de 20 XP, total **100 XP**. A regra de nível (`src/features/gamification/gamification-rules.ts:56–61, 140–144`) coloca 100 XP em "Em movimento" (a partir de 60) rumo a "Ritmo de estudo" (140), e `achievements-board.tsx:108` desenha `progress value={currentXp - startsAt} max={nextRankAt - startsAt}`, ou seja, 40/80. **Não encontrei no código atual nada que desenhe "0/100"**. Candidatos: a barra de retenção de `/progress` (`src/app/progress/page.tsx:85`, `value={retention*100} max={100}`), que mostra 0 para conceitos sem retenção, ou um componente do front reformulado nos PRs #53–#58. **Falta um print da tela para fechar.**

**Dias estudados: regras diferentes.**
- Hoje e conquistas (`gamification-rules.ts`, `buildStudyWeek` e `allStudyDays`) contam só os dias com **questão respondida** (evidência `question_result`/`assessment_result`), no fuso `America/Sao_Paulo`.
- Progresso (`src/features/progress/overview.ts:104–118`) conta os dias com **qualquer evento de estudo** (`study_events`, como abrir aula) **mais** as tentativas.

Um dia em que o aluno só leu a aula conta no Progresso e não conta em Hoje.

**Direção da correção (Fase 5):** uma função única de "dia estudado" (por exemplo, dia com pelo menos uma resposta), no fuso `America/Sao_Paulo`, usada pelas duas telas.

## 4. "Português" e "Língua Portuguesa" como duas áreas

**Causa raiz:** o Progresso agrupa áreas pelo **título do módulo** (`overview.ts:89–97`, `entry.concept.areaTitles`), não pelo código da matéria. O mesmo conceito aparece em duas trilhas:

| Código | Títulos de módulo | Trilhas |
|---|---|---|
| CIE | Ciências | `ifsc-2027`, `ifsc-2027-science` |
| GH | Geografia e História | `ifsc-2027`, `ifsc-2027-history-geography` |
| MAT | Matemática | `ifsc-2027`, `ifsc-2027-mathematics` |
| **POR** | **Língua Portuguesa / Português** | `ifsc-2027` (2 aulas), `ifsc-2027-portuguese` (26 aulas) |

Só Português diverge, porque a trilha antiga `ifsc-2027` (semana 1) chama o módulo de "Português".

**Direção da correção (Fase 5):** agrupar áreas por `subject_code` com um rótulo canônico (`POR → Língua Portuguesa`), normalizando na leitura, sem reescrever dados.

## O que foi corrigido (mesma branch)

- **1:** erro deixa o conceito revisável no mesmo dia (`next_review_at = now`), e `/review`, Hoje e "Revisar agora" leem a mesma fila: conceitos vencidos **mais** conceitos com erro ativo. A leitura cobre os dados antigos, então não foi preciso backfill. Hoje mostra "N conceitos para revisar (X com erro)". Um acerto independente resolve os erros do conceito.
- **2:** pedido dirigido com sessão aberta devolve 409 e o aluno escolhe entre continuar e começar de novo; a antiga só vira `ABANDONED` depois que a nova tem questões.
- **3:** dia estudado = dia com questão respondida, no fuso America/Sao_Paulo, em Hoje, Progresso e conquistas (`src/features/progress/study-days.ts`). O "0/100" não foi reproduzido, mas os números duplicados tinham causa: `CountUp` e a faixa da semana usavam a classe `.sr-only`, que não existe no CSS, e a cópia para leitor de tela aparecia na tela.
- **4:** áreas normalizadas na leitura (`src/features/progress/subject-alias.ts`).
