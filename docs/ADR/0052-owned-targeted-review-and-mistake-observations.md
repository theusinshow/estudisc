# ADR 0052 — owned targeted review and factual mistake observations

Date: 2026-10-07. Status: Accepted for implementation under continuous evolution authorization.

## Selection contract

Quick Review and mistake retry reuse the existing session planner, adaptive candidate factory, priority function, frozen question snapshots and canonical Question submission. Add an optional explicit selection purpose to planning; no parallel engine, altered priority weights or new review/mastery policy version.

Quick Review derives targets from this owner's actually due review schedules. An optional Concept selection must belong to that due set. Mistake retry resolves an owned active mistake and its owned immutable Attempt; it excludes the original Question identity across all versions. Missing/foreign/stale targets fail closed. Coding mistakes without a shared Question context retain the existing Concept/Lab path instead of fabricating an alternate Question.

Use bounded 10/15-minute retrieval presets behind FEATURE_SMART_MISTAKES. A targeted selection can use the existing question-only adaptive composer independently of the general adaptive rollout; legacy planning budgets/behavior remain unchanged. Existing routine limits, reserved/exposure checks and active EXAM exclusions remain authoritative. An owned ACTIVE study session is returned intact after validating the requested target; never recompose it. If no eligible alternate fits, return a factual content gap. Otherwise use existing planner ordering within the constrained pool and freeze actual versions/membership with explicit review/remediation intent/reason.

## Observation contract

Group existing owner-scoped mistakes by atomic Concept and actual stored category, deduplicating Attempt pointers. Report active/resolved counts and dates; two distinct Attempts support only the factual word "recurring", not a diagnosis. Retain original categories/records/history.

The seven pedagogical labels remain a declared taxonomy. Only an actually stored supported category or explicitly attributed source/student report may supply one; an incorrect answer or elapsed time alone never establishes misconception, attention, prerequisite or conceptual gaps. Unknown causes stay unknown. Source distractor tags/rationales, if exposed later, must be labelled author hypotheses rather than canonical evidence. No AI inference controls selection, review, scores or mastery.

Explanation/example access uses existing published Concept/lesson material; different-question retry creates new evidence only through existing successful/failed independent/help-aware submission. Self-rating remains reflection. No synthetic retrieval, urgency, grade or mastery transition is added. Derived observation groups can remain read projections, so no migration/backfill or duplicate membership table is required now.

An explicit student-selected category and optional note are appended as an owned `mistake_reflection` StudyEvent with `basis: student_report` and `canonicalEvidence: false`. A client mutation UUID is idempotent only for the same validated payload; conflicting reuse fails. Owner serialization shares the existing owner transaction lock. Reports preserve original mistakes and never write ConceptEvidence, mastery or review schedules. Missing/foreign mistake IDs fail closed; report labels remain attributed to the student.

## Acceptance and rollback

Meaningful owner/foreign-target/active-session/EXAM/reserved/no-alternate/budget tests with memory and migrated SQL parity. Verify original priority/scheduling/mastery fixtures unchanged, frozen version compatibility, loop from recorded failure to alternate submission, help/independence behavior and mobile/keyboard recovery. Full technical gates precede the protected release. Disable the new entry points to roll back; immutable Attempts/evidence, existing review schedules and original mistakes remain interpretable.
