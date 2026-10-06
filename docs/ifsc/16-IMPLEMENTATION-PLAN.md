# 16 — IFSC Implementation Plan

Status: **Accepted**
Source of truth for: milestone execution order.

## Rule

Do not rebuild the Estudisc foundation. Each milestone extends the current repository and ends with green tests/build/docs.

## Milestones

### IFSC-00 — Documentation integration

- integrate ADRs 0017–0029;
- patch core source-of-truth docs per integration plan;
- install Design System v3 documentation delta;
- update agent rules.

Gate: documentation has no conflicting authority.

### IFSC-01 — Curriculum foundation

Implement:

- CurriculumRequirement;
- ConceptPrerequisite;
- Track Concept settings/importance;
- ContentSource/links;
- coverage queries.

Seed IFSC Track + four Modules + MAT-07 concepts.

### IFSC-02 — Pack v2

- add `caderno.track.v2`;
- keep v1 compatibility;
- fixtures for valid/invalid/update/conflict;
- semantic validation for curriculum references/prerequisites/questions.

### IFSC-03 — Educational interactions

Extend existing registries:

- numeric;
- ordering;
- classification;
- matching;
- text highlight;
- guided steps;
- numeric explorer.

Mobile/accessibility tests are mandatory.

### IFSC-04 — Percentage Golden Slice

End-to-end:

`Today → StudySession → MAT-07 → questions → Attempts → evidence → result → review`

This is the first student-usable IFSC slice.

### IFSC-05 — mastery.v2 / review.v2

Preserve v1. Add:

- independence/hints;
- difficulty/context;
- retention;
- confidence;
- +1/+3/+7/+14/+30 adaptive review.

Golden deterministic tests required.

### IFSC-06 — Study Sessions

- session tables;
- time budgets;
- freeze on ACTIVE;
- resume/abandon;
- result summary.

### IFSC-07 — Planner

- candidate generation;
- priority policy;
- prerequisites;
- subject balance;
- missed-day recomputation;
- exam phase.

### IFSC-08 — Remaining Golden Lessons

Implement POR-01, CIE-06, GH-06 and any required additional Blocks.

### IFSC-09 — Assessment Engine / Diagnostic

- AssessmentTemplate/Instance/Response;
- broad diagnostic;
- targeted diagnostic;
- idempotent finalization.

### IFSC-10 — Official exam bank

Import/classify all 112 historical Integrated questions, preserve assets/status, mark 2025.1 Q15 annulled, enforce exposure policy.

### IFSC-11 — Simulations

- mini;
- subject;
- full;
- protected 2026.1/2026.2 benchmarks;
- result analysis.

### IFSC-12 — Content QA pipeline

- GenerationRun integration;
- structural validators;
- QAReview;
- publication gates;
- source packs.

### IFSC-13 — Tutor

Contextual tutor behind AI Gateway. Disabled in EXAM. Evidence records solution exposure.

### IFSC-14 — Full curriculum seed

- 100% requirements mapped;
- all critical content planner-ready;
- then all official requirements planner-ready.

### IFSC-15 — Exam-preparation hardening

- mobile polish;
- performance;
- offline/PWA only if low-risk and useful;
- assessment reliability;
- content gaps;
- production observation;
- freeze risky feature work near exam date.

## Suggested calendar from 1 October 2026

- Oct 1–7: IFSC-00 to IFSC-04; start studying as soon as MAT-07 and first usable sessions work.
- Oct 8–14: IFSC-05 to IFSC-09; produce high-priority content in parallel.
- Oct 15–28: IFSC-10/11/12 + major curriculum production.
- Oct 29–Nov 8: complete official coverage, QA, planner/content tuning.
- Nov 9–15: protected 2026.1 intermediate benchmark + remediation.
- Nov 16–21: consolidation and remaining critical gaps.
- Around Nov 22: protected 2026.2 final benchmark.
- Nov 23–28: targeted review, mixed practice, no risky architecture changes.
- Nov 29: exam.

Exact benchmark dates are configuration, not hardcoded business logic.

## Milestone gate

Before proceeding:

- relevant tests green;
- typecheck green;
- lint green;
- build green;
- affected E2E green;
- migrations/fixtures valid;
- docs/changelog/status updated;
- no critical TODO hidden behind the next milestone.
