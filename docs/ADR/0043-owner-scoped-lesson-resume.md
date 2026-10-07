# ADR 0043 — Owner-scoped lesson resume separate from attempts

Date: 2026-10-06. Status: Accepted for local implementation. Extends ADRs 0040/0042; no production migration or content publication is authorized here.

## Problem

Standalone lessons retain only their step hash; session steppers share a page and cannot each own that hash. Unsent Question responses disappear on reload. Persisting display state must not create attempts, fabricate assistance or overwrite a newer canonical answer.

## Decision

Use an additive mutable user-state snapshot keyed by owner, track, lesson version and standalone/session context. Store stable step ID, expanded view, visible-page elapsed seconds and bounded unsent Question drafts. Do not persist grades, mastery, canonical solutions or arbitrary component/provider state. No Pack schema change or parallel renderer.

Validate scope against a published lesson version and, for session context, the owner's ACTIVE frozen membership before reading/writing. Validate draft activity/Question/version membership against that scope. Auth owner remains server-derived through the existing guard.

Serialize writes under the existing owner lock with optimistic revision and mutation identity; identical retry is idempotent. Stale writes cannot overwrite a newer snapshot. A client conflict stops autosave and offers explicit recovery. Scope/version changes use a separate snapshot; removed step IDs visibly recover to the first valid step.

Canonical Attempts and assistance remain authoritative. Each draft names the canonical attempt from which editing began and retains its submission UUID for retry. A draft is usable only if this base still matches the latest canonical attempt and the draft has not already been submitted. The existing Question evaluator alone records submission/evidence. Reloaded feedback/hints derive from actual server records, never resume JSON.

Extend existing LessonSteps/Stepper and shared QuestionPanel through a scoped React provider. Explicit save plus serialized debounced saves display state/errors; page exit attempts a bounded keepalive save. Visible-page elapsed time is an estimate, excludes background intervals and does not award XP, official time or mastery. Generic activity snapshots beyond shared Question inputs wait for their typed interaction contracts.

## Consequences

One additive empty user-state table; no backfill or published-content transformation. Draft schemas and scope tests precede persistence/UI. Default-off interactive rollout controls new writes; legacy hash/answers/assistance readers remain. No guaranteed save during abrupt offline process termination; visible save status/retry communicates that limit.
