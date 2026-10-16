# 09 — Assessment System

Status: **Accepted**
Source of truth for: diagnostics and simulations.

## Unified engine

Do not create separate DiagnosticEngine, SimulationEngine and OfficialExamEngine.

Use one Assessment Engine with `kind`:

- `BROAD_DIAGNOSTIC`
- `TARGETED_DIAGNOSTIC`
- `MINI_SIMULATION`
- `SUBJECT_SIMULATION`
- `FULL_SIMULATION`
- `OFFICIAL_EXAM`
- `PAST_EXAM_SHEET` (answer sheet for a past exam; see below and ADR 0066)

## Template and instance

`AssessmentTemplate` defines rules and eligible/fixed questions.

`AssessmentInstance` freezes:

- question versions;
- order;
- choice order if randomized;
- time configuration;
- student;
- mode;
- start/finalization timestamps.

Reload must not silently produce another exam.

## In-progress responses

During an open exam, the student may change answers. Store mutable `assessment_responses`.

On finalization, create the official immutable Attempt/evidence representation transactionally and idempotently.

## Broad diagnostic

Initial diagnostic target:

- 28 questions;
- 7 per area;
- broad Concept coverage;
- not necessarily full four-hour simulation conditions.

It produces initial evidence/confidence, not a simplistic “42% knowledge” claim.

## Targeted diagnostic

After broad diagnostic, ask focused items where:

- area confidence is low;
- prerequisite location is uncertain;
- error pattern needs disambiguation.

Stop when additional questions are unlikely to materially change the plan.

## Full simulation

- 28 questions;
- seven per subject;
- five alternatives for official-style multiple choice;
- no hints;
- no tutor;
- no correctness feedback before finalization;
- timer supports up to four hours;
- fixed snapshot.

## Answer-sheet past exams

`PAST_EXAM_SHEET` (ADR 0066) lets a student answer a complete past IFSC exam on an A–E answer sheet while reading the official PDF on the IFSC site.

- Templates hold positions 1..N (N ∈ 20/24/28), the definitive answer key, optional subject ranges and official links.
- Snapshots and views never contain the key before FINALIZED. Answers are stored in `assessment_sheet_responses`.
- Finalization is the shared idempotent path. It emits the `assessment_finalized` event but no Attempt, ConceptEvidence, review or mistake.
- Training score: annulled items leave the denominator and a blank counts as incorrect. It is not the official classification rule.
- An ACTIVE sheet uses `mode: "EXAM"`, so the existing EXAM guards apply.

## Result

Show:

- overall correct count;
- per-subject correct count;
- Concept/error analysis;
- time distribution where reliable;
- new Planner priorities.

Do not rank the student against an invented cohort.
