# ADR 0042 — Adaptive sessions extend the existing planner

Status: Accepted for local implementation (user authorized the next increment in this session, 2026-10-06).

## Decision

`FEATURE_ADAPTIVE_SESSION` (default off) selects `planner.v2` through the existing planner/session repositories. Legacy policy/readers remain. Offer 10/20/30/45-minute budgets; legacy 15/30/60 requests remain compatible. Use one injected clock for composition, exposure, mastery/retention, exam phase and stored timestamps.

- Return the existing ACTIVE session unchanged before recomposition. Serialize creation/start with the existing owner lock; failed planning preserves a prepared snapshot.
- Candidate order is due review → active-error remediation → weak/incomplete practice → new learning, with existing numeric priority dimensions and stable identity ties inside each group. Required prerequisites constrain new learning. Track-specific exam phases cap new learning; routine subject/time limits remain cumulative.
- Short budgets deliver shared Questions through the existing Activity registry. Do not clamp a whole lesson's editorial duration to pretend it fits. Question estimates are explicitly versioned heuristics (foundation 3/direct 4/applied 5/ifsc 6/challenge 8 minutes, plus 2-minute entry overhead); planned estimates never imply measured time.
- Full new lessons require actual independent QA records plus objectives, sources, checkpoint and a sufficient available training pool. Publication mode alone is not readiness. Published/exposable questions may still be practiced with visible missing-review/mapping caveats. This does not certify source rights or official curriculum mapping. No independent approval is fabricated in memory fixtures.
- Exclude reserved, unreleased, retired and annulled questions; no learning planning while an owned EXAM is ACTIVE. Exclude earlier independent successes from ordinary practice; due retrieval may repeat under existing exposure rules. Prefer a different eligible question for an active mistake. Deduplicate stable Question identities across the composed session.
- Extend the existing SessionItem JSON additively with optional intent/reason/caveats/Concepts, delivery mode, per-item track and minimal authored Activity snapshots (no embedded canonical Question answers/assets). Existing items parse unchanged; published Packs are unchanged. ACTIVE content/version/composition is immutable.
- Cross-track composition uses per-item track/lesson/version/activity/question membership. The existing question study service validates frozen membership before selecting a canonical activity row, preventing latest-version drift and cross-owner/track substitution. Shared evaluator, assistance, exposure and evidence policies remain authoritative; display intent never changes evidence weight or review schedules.
- The shared Activity registry renders question-only actions; existing LessonSteps renders eligible full lessons. Persisted delivery remains readable with the feature off.
- Summary reports requested budget, planned estimate, wall-clock interval (includes pauses), unique/latest answers and actual appended Concept evidence/retrieval. Completion never creates mastery/review evidence. Next action comes from existing deterministic recommendations.

## Consequences

No new renderer, planner, mastery/review/scoring engine or Pack schema. New snapshots are compatible user state; no data backfill/migration. Bulk canonical question/exposure reads replace per-activity availability reads on the adaptive path. Real-PostgreSQL concurrency and production rollout remain separate gates; local SQL fixtures are disposable.

Rejected: AI composition, published=certified, editing frozen versions, copying solutions into snapshots, silently forcing a long lesson into ten minutes, claiming wall-clock as active study, or regenerating a session on GET/resume.

Model routing: the user's continuation permits this session's implementation; no model switch/independent model review is claimed. Meaningful future evidence/scoring or irreversible-production changes retain their higher-risk review/authorization boundaries.
