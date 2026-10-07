# ADR 0044 — Typed exploratory interactions in the existing lesson runtime

Date: 2026-10-06. Status: Accepted for local implementation. Extends ADRs 0032/0043; no production publication or migration.

## Decision

Extend the existing block dispatcher/Activity registry and owner-scoped resume. Exploration is display state: never an Attempt, ConceptEvidence, official score or mastery. Existing shared Questions remain the assessed practice path. Local checked feedback is recomputed from canonical authored configuration and saved response, never accepted as a stored grade.

Add optional typed interaction state keyed by block/activity plus stable ID. Store only bounded responses/parameters, observation/check phase and help usage. Validate kind, IDs, assignments, order, values and help range against the immutable source version and owned ACTIVE composition. A question-only session cannot save undisplayed lesson blocks. No arbitrary JSON/provider state. Existing revision/idempotence and owner lock remain the single write boundary.

Do not inject a new field/default into legacy resume payloads: their mutation hashes and retries remain valid. Absent interaction state retains the previous snapshot field; explicit arrays can update/clear it. New clients use the same compatible JSON table; no database migration or content backfill.

Prediction precedes observation/explanation and leads to the existing practice. Matching uses native selects; ordering/timeline uses keyboard/touch buttons. Numeric/atom explorers retain validated values and text equivalents. New authored assistance may explicitly supply hint, recall, analogous example and walkthrough; legacy hints retain their existing text/meaning. Exploratory help is persisted separately from canonical Question assistance and never changes its evidence weights.

Safe figures reuse ADR 0032 data-URI validation and textual fallback. Comparison metadata is an optional figure-payload extension with the original first-image fallback; existing readers remain usable. Hotspot/map are already declared Pack V2 block types: enabling their validated presentation does not alter the Pack envelope. Register supported semantics with compatibility fixtures and a no-transform rollout plan. Unknown/invalid or failed visual content must leave the lesson readable.

Geometry uses bounded data attributes and generated same-origin CSS, never inline style attributes or a relaxed CSP. Hotspot points use explicit whole image percentages (0–100); zoom uses quarter steps (1–3), comparison whole percentages. Centering uses margins rather than motion transforms so reduced-motion policy cannot move the targets. Generated styles have a deterministic check command; preserve 44px targets and actual rendered coordinate/clipping/zoom assertions.

MapLibre adoption is deferred until an approved geographic blueprint actually needs a geographic engine and its worker/tile/source/exposure boundary is settled. The authored map pilot is a labelled offline diagram plus accessible location list; it is not geographic rendering or a claim that MapLibre is integrated. No network tiles, new CSP allowance, dependency or reserved asset copying.

## Rollout and limits

New interactive presentation/resume uses default-off FEATURE_INTERACTIVE_LESSONS. Existing authored blocks and immutable published versions remain unchanged. New examples are disposable fixtures/drafts. No schema migration, re-import or publication. Implement typed state for the supported existing/new blocks only; complex simulations, stronger evidence/help weighting and real map providers retain their separate domain gates.
