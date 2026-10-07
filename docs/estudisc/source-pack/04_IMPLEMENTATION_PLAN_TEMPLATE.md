# Estudisc — Implementation Plan

> Deve ser preenchido após `IMPLEMENTATION-GAP-ANALYSIS.md`.

# 1. Strategy

Resumo da estratégia incremental.

# 2. Guardrails

- no rewrite;
- additive-first migrations;
- mobile-first;
- preserve content;
- feature flags;
- deterministic learning core;
- AI optional/fallback;
- accessible interactions.

# 3. Phase 0 — Stabilization

## Goals

- CI green.
- Critical E2E green.
- source-of-truth docs coherent.
- DS version canonical.

## Tasks

- [ ]
- [ ]

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

# 4. Phase 1 — Design Foundation

## Components
- TopBar
- BottomNavigation
- PageShell
- FocusShell
- semantic tokens
- motion tokens

## Files
- ...

## Tests
- ...

# 5. Phase 2 — Today

## Components
- StudyActionCard
- TodayPlan
- AttentionSection
- LearningSummary

## Data
- unified Today read model
- recommendation reason

# 6. Phase 3 — Planner

## Domain
- StudyPlan
- StudyDayAllocation
- TemporaryOverride
- PlannerMode

## Persistence
- ...

## UX
- onboarding
- week view
- routine view
- rebalance

# 7. Phase 4 — Adaptive Session

## Domain
- SessionBudget
- SessionCandidate
- SessionComposition
- SelectionReason

## Rules
- deterministic only

# 8. Phase 5 — Lesson Runtime

## Data
- LessonSection
- LessonStep
- LearningBlock

## Compatibility
- existing lessons must continue rendering.

# 9. Phase 6 — Interactive Blocks

Implement in order:
1. Prediction
2. Image
3. Matching
4. Sorting
5. Timeline
6. Comparison
7. Hotspot
8. Slider
9. InteractiveMap

# 10. Phase 7 — Visual Assets

- Asset Registry
- metadata
- fallback
- accessibility

# 11. Phase 8 — Blueprint Pipeline

- local extractor
- classifier
- clustering
- confidence
- hashes
- reports

# 12. Phase 9 — Enrichment

Batch size:
- 10–20 lessons.

Each batch:
- blueprint review;
- implementation;
- QA;
- accessibility;
- content verification.

# 13. Phase 10 — Review & Mistakes

- Quick Review
- Smart Mistake Notebook
- targeted practice

# 14. Phase 11 — AI Learning

- provider abstraction
- Explain Differently
- Help Levels
- mistake analysis
- session summary
- relation explanation

# 15. Phase 12 — Knowledge Map

- concept graph
- React Flow
- mobile UX

# 16. Phase 13 — Real Exam

- timer
- navigation
- final review
- result analysis

# 17. Phase 14 — Admin

- block editor
- preview
- asset library
- content health

# 18. Feature flags

Map each phase to flag.

# 19. Migrations

List all additive migrations.

# 20. Rollback

Describe how each phase can be disabled or rolled back.

# 21. Definition of Done

A phase is complete only when:
- tests pass;
- docs updated;
- feature flag behavior verified;
- mobile validated;
- accessibility checked;
- no known regression.
