# ADR 0071 — Confidence check changes review priority

Status: Accepted
Date: 2026-10-17
Amends the review rules of ADR 0024 (review.v2) for lesson and review Questions. Mastery policy v2, evidence strength, XP and exams are unchanged.

## Context

A correct answer reached by guessing currently counts as independent recall: it advances the spaced-review stage and closes the Concept's open mistakes. A wrong answer the student was sure of (a blind spot) waits in the review queue in plain due-date order, alongside ordinary mistakes. Lab item 8.6 tested an optional "Quanto você tem certeza?" step, and the owner approved it.

## Decision

1. **Input.** A Question submission may include `confidence`: `sure` ("Tenho certeza"), `unsure` ("Acho que sim") or `guess` ("Chutei"). It is optional, self-reported before checking, and validated by `confidenceSchema`. It is never required, never inferred and never sent for hints or solutions.
2. **Record.** The value is stored in the immutable Attempt's `context` and copied into the ConceptEvidence `conditions`, as for hint level. No migration is needed (the columns are jsonb).
3. **Review rules** (`src/features/review/confidence.ts`, deterministic):
   - A correct answer with `guess` is **not independent**. The review.v2 stage does not advance (interval capped at 3 days), and the Concept's open mistakes stay open.
   - A wrong answer with `sure` is a **blind spot**. The mistake gets its own summary, and the review queue (Today, /review and Progress share it) lists blind spots before every other due Concept, with the reason "Ponto cego…".
   - `unsure`, or no answer, keeps today's behaviour.
4. **Unchanged.** Evidence strength and mastery state, XP rewards, exams/simulados (no picker), the planner, and AI (it does not read or set confidence).

## Consequences

- Students who guess see the Concept again sooner, and confident errors are reviewed first.
- Older Attempts have no `confidence` and behave as before.
- A later change that lets confidence affect mastery strength needs its own ADR and recalibration tests.
