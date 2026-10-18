# Practice blocks replace time-budget sessions — design

Date: 2026-10-18
Status: approved by the owner in conversation (sections 1–4), pending written-spec review
Decision record to write with the implementation: ADR 0072

## Why

ADR 0060 made the continuous lesson flow the primary study path, but the older model never left: Revisão ("Começar revisão rápida") and Erros ("Praticar outra questão") still open `/study/<id>` time-budget sessions ("Sessão de 10 min", "Roteiro da sessão", whole lesson blocks, "Concluir sessão"), students still pick 10/15 minutes, and the weekly routine planner and `/plan` remain behind flags. The owner finds the flow confusing and chose: **continuous lessons only**, with review and mistake practice as **short blocks of up to 5 Questions**, one at a time, with a summary at the end — no session wording, no time choice.

## Student experience

- **Hoje / Estudar:** unchanged. "Continuar" opens a whole lesson.
- **Revisão:** the top action becomes **"Revisar agora"** (no time choice): a block of up to 5 Questions from the due queue, blind spots and active mistakes first. Each card offers **"Praticar este conceito"**: a block of up to 5 Questions of that Concept.
- **Erros:** each subject offers **"Praticar este assunto"**: a block of up to 5 Questions of that subject, starting with the Question the student missed.
- **Practice screen:** block title ("Revisão" or the Concept name), "2 de 5" with a small progress bar, one Question at a time with the existing question panel (hint, solution, confidence check), "Próxima" after answering. At the end: **"3 de 5 sem ajuda"**, the list of the block's Questions marked ✓/↺, and **"Mais 5"** (only when more Questions are available) and **"Voltar"**. Leaving mid-block and practising the same target again resumes at the first unanswered Question.
- **Removed from the student UI:** "Sessão de N min", "Roteiro da sessão", lesson blocks inside practice, "Concluir sessão", every practice time selector (including the shared "Tempo para cada prática" shipped on 2026-10-18), `/plan`, the weekly routine, the legacy Hoje session chooser.
- **Old open time-budget sessions:** not shown on Hoje or Revisão; opening their link shows a read-only summary with "Ir para Hoje". Their answers keep counting.

## Architecture

Approach 1 (owner choice): keep the existing session engine underneath; replace what the student sees and drive selection by Question count.

- **Unchanged:** the `study_sessions` table, targeted selection (`TargetedSelection`: owned schedules and Attempts, exposure policy, reserved Questions excluded), frozen `activitySnapshots`, Attempt recording with `sessionId`, ConceptEvidence, mastery, spacing, achievements. No migration.
- **Practice block = targeted session capped at 5 Questions.** `POST /api/study-sessions` accepts `{ action: "practice_block", target }` where `target` is `{ kind: "review" }` (whole due queue), `{ kind: "review", conceptId }` or `{ kind: "remediation", mistakeId }`. The repository applies a **question cap of 5** across items on top of the current targeted selection; the internal minute budget is fixed and never chosen by the student. Items use `delivery: "questions"` with `activitySnapshots`, so a block never loads a whole lesson.
- **Auto-complete:** when the last Question of the block has an Attempt, the practice screen calls the existing `complete` transition.
- **Resume / replace:** practising the same target with an ACTIVE block returns that block; a different target abandons the open block through the existing `startNew` path (Attempts stay) and starts a new one. This replaces the "continuar ou começar do zero" prompt for practice.
- **"Mais 5":** the summary asks the server whether the same target still has eligible Questions; if so, a new block for that target starts.
- **Screen:** `/study/[sessionId]` renders practice blocks (one Question at a time, progress, summary) with the lesson question panel. Legacy time-budget sessions (lesson delivery or no target) render a read-only summary with a link to Hoje.
- **Removed code:** the `/plan` page (keeps the redirect to Hoje), the weekly routine planner (UI, API routes, policy/context modules once unused), the 10/20/30/45/60 budget controls (`SessionControls`), `PracticeMinutesProvider/Picker` and `TargetedPracticeControls`' time selector, the legacy Hoje branch with `TodayPlan`, and the flags `FEATURE_STUDY_PLANNER` and `FEATURE_ADAPTIVE_SESSION`. The continuous flow becomes unconditional (`FEATURE_CONTINUOUS_STUDY` retired once its branches are gone). Planner and session tables stay as history.
- **ADR 0072:** practice blocks replace time-budget sessions and the planner is retired. Supersedes ADR 0021 (deterministic planner) and ADR 0041 (weekly routine), point 7 of ADR 0060 and the budget part of ADR 0042 (its frozen snapshots stay).

## Edge cases

- **Fewer than 5 eligible Questions:** the block contains what exists ("1 de 3"). None: no block starts and the button shows "Sem questões novas para este conceito agora. Volte amanhã ou revise a aula." with a lesson link.
- **Simulado in progress:** practice stays blocked ("Termine o simulado antes de praticar").
- **No full access:** the current paywall message with "Ver acesso completo".
- **Two tabs:** Attempts keep their unique submission key; the block completes when every Question has an Attempt, whichever tab answered.
- **Target no longer due:** an open block can still be resumed; if abandoned, its Attempts keep counting.
- **Empty review queue:** no "Revisar agora"; the existing "Nada para revisar hoje" with "Ir para Hoje".
- **Legacy sessions:** never created again; an open one stays dormant and its link shows the read-only summary.

## Testing

- Unit: 5-Question cap on targeted selection; auto-complete on the last Attempt; resume vs. abandon by target; "Mais 5" availability; fewer-than-5 and none.
- Component: practice screen (progress, next, summary ✓/↺, "Mais 5"/"Voltar"); Revisão and Erros buttons without time selectors.
- E2E: Revisão (miss → "Praticar este conceito" → answer the block → summary); Erros ("Praticar este assunto"); resume after reload. Remove the e2e of retired features (`routine-planner`, `session-navigation`, `adaptive-session`, planner parts of `foundation-evolution`), including today's known failure on "Começar sessão".
- Acceptance: `pnpm lint`, `pnpm typecheck`, `pnpm test`, e2e with and without the lesson flags; 390/320 screenshots of the practice screen, Revisão and Erros for owner approval before push.

## Rollout

Code only, no migration; old sessions remain history. Docs: ADR 0072, PLANS, PROJECT_STATUS, CHANGELOG.
