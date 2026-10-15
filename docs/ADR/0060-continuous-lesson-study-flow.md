# ADR 0060 — Continuous lesson study flow replaces time-budget sessions as the primary path

Status: Accepted
Date: 2026-10-15

## Context

A real student completed 26 time-budget sessions (02/10–15/10) and only ever received lesson 01 of each subject plus the fraction preparation lesson. A read-only run of the production adaptive planner on that student's data showed why:

- `learn` requires `fullReady`, which requires recorded independent QA. All 132 published lessons went live through authorized Admin Direct, so none qualified as new learning.
- 109 of 131 lessons also lack `objectives` or `exitTicketQuestionIds`, and the fully described lessons need 35–141 minutes of questions, above the largest 60-minute session.
- Adaptive ordering ranked review > remediation > practice > learn, so due reviews of already touched lessons filled every session.

The student also created several sessions within a minute while changing the duration. Choosing a time budget added friction without helping.

## Decision

1. The primary study action on Today is **Continuar estudando**. It opens one whole published lesson on the existing lesson page (`/lessons/<id>`), never a time-budget session.
2. A lesson resumed mid-way keeps its place through the existing lesson-scoped resume (`contextKey = "lesson"`). Leaving and returning continues where the student stopped.
3. A lesson counts as done when its lesson-scoped resume is `completed`, or when the student has answered at least 80% of the distinct Questions of its latest published version (matched by Question id across versions, so earlier session work counts).
4. The next lesson is the most recently touched unfinished lesson; otherwise the first unfinished lesson, in track order, of the subject with the fewest finished lessons (ties: MAT, CIE, GH, POR). The student can also jump to the next lesson of a specific subject.
5. Review and mistakes stay separate (existing Revisão and Erros), shown as attention items, and never consume the lesson.
6. Lesson completion only drives sequencing. It never writes ConceptEvidence or mastery. Attempts stay immutable.
7. Time-budget sessions and the routine planner remain available on Plano behind the existing flags. The flow is gated by `FEATURE_CONTINUOUS_STUDY`.
8. In the adaptive planner, an authorized Admin Direct publication counts as publication readiness for `learn`, and the first fitting `learn` candidate leads a session. The independent-QA caveat stays visible. Editorial Reviewed remains distinct.

## Consequences

- Students always advance through real content. The full lesson replaces partial question bundles as the main experience.
- Missing lesson metadata (objectives, exit tickets) no longer blocks students. It remains a content-quality gap, tracked by the AI-assisted lesson review of 2026-10-15 and fixed through new immutable lesson versions.
- The 80% rule can mark a lesson as done although its explanation blocks were not reread. The student can still reopen any lesson from Aprender.

## Validation / review trigger

Unit tests cover next-lesson selection, done detection across versions and subject rotation. Revisit when assessments or a cohort calendar need date-driven sequencing.
