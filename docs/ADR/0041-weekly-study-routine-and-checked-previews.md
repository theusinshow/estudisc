# ADR 0041 — Weekly time routine and checked previews

Status: Accepted for local implementation (user authorized this session to continue Phase 3, 2026-10-06).

## Decision

Extend the study-session/planner feature with `routine.v1`, a weekly time-allocation policy. It organizes time by subject; it does not replace question selection, prerequisite/exposure checks, mastery or the unified assessment engine.

- One owner has one versioned routine: IANA timezone; seven days with integer 0–240 minutes and optional suggested start time; selected generic subject codes/priorities; AUTOMATIC/ASSISTED/MANUAL mode; dated minute overrides; optional dated focus; review target percentage and optional weekly simulation time reservation.
- AUTOMATIC distributes among selected subjects equally. ASSISTED uses explicit low/normal/high priorities (1/2/3). Temporary focus doubles the chosen subject's weight within its date interval. MANUAL preserves explicit per-day allocations; it never silently reallocates subjects. Overrides may proportionally cap an over-budget manual day; that adjustment is visible in the preview. Unallocated manual time is visible and cannot be silently consumed by automatic session selection.
- All settings changes require an explicit preview/apply, including AUTOMATIC. Modes control allocation, not authorization or hidden persistence. No AI owns time allocation.
- Calendar dates derive from one injected evaluation clock in the routine timezone. Weeks start Monday. Past days generate no new tasks or allocations. Future days are recomputed within their own available minutes, considering declared subject minutes in COMPLETED sessions of this calendar week. Missed time does not become debt or increase future availability.
- Planned subject minutes from completed sessions are allocation facts, not measured elapsed time or mastery evidence. Unknown/malformed session snapshots fail validation. ACTIVE snapshots stay unchanged; configuration changes never complete/abandon/edit them.
- Simulation minutes reserve part of the selected day's budget. If a temporary override no longer fits the full reservation, omit it and show a warning; do not claim a partial real exam was scheduled. Review percentage is a transparent target within subject study minutes, not extra time or proof that retrieval happened.
- Saved allocations constrain new session time/subjects and PLANNED-session starts. Existing ACTIVE sessions remain resumable even after a routine change. Legacy behavior remains when the flag is off or no routine exists. Keep current 15/30/60 session requests and scoring/priority weights; 10/20/30/45 adaptive composition remains Phase 4.
- Published subject presence is enough to offer a routine choice, not enough to certify content readiness. Existing published-content/prerequisite/reservation checks remain authoritative. New readiness semantics require a separately tested policy.
- Previews are server-derived, owner-bound, expire after 15 minutes and pin the base routine revision, local date/policy and relevant subject/session facts. Apply locks the owner and checks revision/dependencies/expiry atomically. Repeated application of the same preview at its applied revision is idempotent; an old preview cannot overwrite a newer plan. Append a truthful study event once per apply.

## Persistence and compatibility

Add routine settings/revision and preview snapshots in separate user-state tables; do not transform existing learner data or published Packs. Memory and SQL implementations share validated contracts and pure policy. Feature off keeps the previous shell/session paths. Existing backups retain their contract; routine configuration is not yet part of that Pack and must be explicitly described as such until a compatible export/restore contract is approved. Do not imply routine settings are backed up by the old export.

## Consequences and alternatives

Automatic/Assisted allocate in 15-minute blocks, matching the current session minimum, with a final smaller remainder kept visible. Weighted shares are approximate on a single day and balance over the week. Manual allocations remain explicit. This avoids splitting a short day into four unusable 7-minute automatic targets. Historical fractional planned minutes round up conservatively for budget checks; records are not rewritten.

Subject budgets are predictable and explainable. Manual allocations can leave time unassigned; the UI displays it rather than inventing priorities. Automatic/Assisted use weighted fair allocation with stable subject-code ties, preserving explicit preferences and current-week continuity. This is a conservative initial policy, not a new pedagogical weighting algorithm.

Rejected: AI scheduling; silently saving a preview; client-authoritative week snapshots; rebuilding ACTIVE sessions; carrying missed lessons as debt; using publication mode as certification; changing stored Pack/evidence schemas; silently deleting previews/data on rollback. Disable the rollout and retain compatible settings/snapshot readers instead.

Production migration/deployment remains a separate authorization boundary. SQL concurrency acceptance uses isolated test state; memory tests alone do not establish database locking correctness.
