# 02 — Scope

## Approved IFSC scope

CurriculumRequirement mapping/prerequisites/importance, shared versioned Question Bank, StudyPlan/StudySession, deterministic Planner, unified Assessment Engine (diagnostic/simulation/official), official provenance/reservation, educational interactions, mastery.v2/review.v2, publication QA and optional contextual tutor are approved. No public signup, organizations, billing or social product. See ifsc/16-IMPLEMENTATION-PLAN.md. The original V1 scope below remains applicable to core functionality.

## V1 in scope

- Private allowlisted ADMIN/STUDENT profiles with isolated owner state (ADR 0026).
- Tracks, modules, lessons, concepts and content blocks.
- Activity engine with prediction, multiple choice, explanation, code and debug activities.
- Immutable attempts and study-event history.
- JavaScript Programming Lab with isolated execution, stdout, stderr and tests.
- Deterministic concept mastery and explainable evidence.
- Review queue with spaced scheduling.
- Mistake classification and mistake-based practice.
- Project contexts.
- Track, module, lesson, session, context, progress and backup Pack flows as contracts mature.
- Import validation, preview, diff, version handling and atomic application.
- Teacher-context export.
- XP, levels, ranks, missions and badges that remain separate from mastery.
- Responsive, accessible interface using the approved Design System.

## Explicitly out of V1

- Public marketplace.
- Billing and subscriptions.
- Organizations, classrooms and instructor administration.
- Social feed, public profiles or leaderboards.
- AI-generated mastery scores.
- Mandatory AI tutor.
- Arbitrary shell, Python, database or server execution.
- Multi-language code runtimes beyond JavaScript unless separately approved.
- Real-time collaborative editing.
- Native mobile applications.
- Full repository ingestion or automatic code changes in user projects.

## Scope control

Any feature not listed in V1 requires placement in the roadmap before implementation. Agents must not add speculative features merely because a screen has empty space.
