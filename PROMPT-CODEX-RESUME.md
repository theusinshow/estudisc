# Prompt de retomada do Codex — Estudisc

Use este prompt somente quando uma sessão anterior terminar por limite de contexto, fechamento do terminal ou interrupção técnica.

## Prompt

Resume Estudisc autonomous implementation from the durable repository state.

Read, in order:

1. `AGENTS.md`
2. `AUTONOMY.md`
3. `PROJECT_STATUS.md`
4. `PLANS.md`
5. the relevant roadmap, specification, ADR, and Design System documents for the current phase.

Do not restart discovery, discard completed work, or ask the user to repeat previous decisions.

Inspect Git status, recent commits, the verification log, blockers, and `NEXT ACTION`. Verify the current state with the narrowest safe checks, repair any incomplete increment, and continue automatically through the approved roadmap under `AUTONOMY.md`.

Do not push, deploy, publish, purchase, access real secrets, write outside approved roots, or expand scope without explicit confirmation.

Begin from the recorded `NEXT ACTION` now.
