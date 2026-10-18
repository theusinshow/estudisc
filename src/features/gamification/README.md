# Gamification

XP, ranks, missions and badges live here. Gamification must remain separate from mastery.

V1 uses deterministic rules over XP, review state and mistakes to calculate rank, badge eligibility and mission status. Persistence is limited to audit/readback projections:

- `xp_transactions` is the append-only XP ledger.
- `badge_awards` records a badge once when the deterministic rule marks it earned.
- `mission_progress` stores the current deterministic mission status.
- `mission_progress_events` appends status-change audit records.

These records do not certify mastery and must not become inputs to mastery or recommendation policies.

## Badges (study track)

All badges are computed from answered Questions (`question_result` and `assessment_result` evidence); "without help" means `isIndependentQuestionSuccess` (no hint, no solution). Awards are recorded once and grant no XP.

| Badge | Rule |
| --- | --- |
| Saiu do zero / Pegou o embalo / Bagagem de estudo / Cinquentinha | 1 / 5 / 20 / 50 different Questions right without help |
| Nível prova | 5 different `ifsc` or `challenge` Questions right without help |
| Volta pelo edital | at least one right answer without help in each subject (Concept prefix MAT, POR, CIE, GH) |
| Primeiro simulado | one finished simulado (distinct `assessmentId` in assessment evidence) |
| Ficou na memória / Memória de elefante | 1 / 5 right answers without help after 24 h (`delayedRetrieval`) |
| Virou o jogo / Virada tripla | 1 / 3 previously failed Questions later right without help |
| No seu ritmo / Dez dias de estudo | answers on 3 / 10 different days (not necessarily in a row; wrong answers count) |

Added 2026-10-18 under the same policy version (`gamification.v2`): the new badges only add awards and never change XP keys. Confidence ("Tenho certeza") is deliberately not rewarded so the check stays honest.
