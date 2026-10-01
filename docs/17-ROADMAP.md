# 17 — Roadmap

## Active approved expansion

The V1 phases below are historical. Continue through IFSC-00 → IFSC-01 → … → IFSC-15 per ifsc/16-IMPLEMENTATION-PLAN.md, validating and recording each gate. The user authorized continuous local implementation. Production migrations, pushes and deployment retain separate approval boundaries.

Execution protocol: `AUTONOMY.md`.

The lead agent may progress automatically through these phases, but each phase must remain independently planned, validated, documented, and checkpointed. Do not collapse the roadmap into one unstructured implementation.

## Common phase gate

Before starting the next phase:

- all current acceptance criteria pass;
- required checks have actually run;
- known regressions are repaired;
- `PLANS.md`, `PROJECT_STATUS.md`, documentation, and changelog are current;
- a local Git checkpoint is created when safe and available;
- unresolved risks do not invalidate the next phase;
- the next phase remains inside approved V1 or IFSC expansion scope.

## Phase 0 — Foundation

- Application scaffold.
- Design token pipeline.
- Accessible shell.
- PostgreSQL/Drizzle foundation.
- Validation, tests and CI.

## Phase 1 — First vertical slice

```text
Import Track Pack
→ browse Track and Lesson
→ open JavaScript activity
→ RUN code
→ SUBMIT solution
→ record Attempt
→ update simple progress projection
→ show History event
```

This phase validates the most important boundaries without implementing the complete mastery/review system.

## Phase 2 — Learning core

- Concept pages.
- Lesson block renderers.
- Activity registry.
- Attempts and feedback.
- Track/lesson progress.

## Phase 3 — Programming Lab

- hardened runtime;
- terminal output;
- automated tests;
- attempt diffs;
- debug activities.

## Phase 4 — Mastery, review and mistakes

- evidence model;
- mastery policy;
- review scheduling;
- mistake categorization;
- recommendation rules.

## Phase 5 — Projects and gamification

- project contexts;
- XP ledger;
- ranks, badges and missions;
- knowledge map.

## Phase 6 — Portability and hardening

- complete Pack formats;
- backup/restore;
- teacher-context export;
- accessibility and security audits;
- deployment preparation and owner authentication.

Production deployment itself remains an external write and requires user confirmation.

## Public-product future

Multi-user accounts, billing, marketplace and broad subject ecosystem require new product discovery and ADRs. They are not hidden V1 requirements and cannot be added autonomously under the V1 authorization.
