# ADR 0046 — Local, hash-bound lesson blueprint proposals

Status: Accepted for local proposal generation (2026-10-07).

## Context

The approved evolution needs 132 compact blueprints before enrichment. Existing local Pack artifacts contain immutable teaching content but mostly lack explicit objectives; original draft statuses differ from later audited publication. Sending complete lessons to a strong model, inventing objectives or treating publication as independent review would violate project boundaries.

## Decision

Extend the existing Studio CLI/catalog/assets with version-bound, deterministic, UNREVIEWED proposal sidecars. Pin the four import artifacts identified by historical production evidence, preserve their statuses and expose publication/source caveats. Extract only compact teaching metadata locally; no Question content/media bytes. Classify from title/Concept/objective cues, retain null goals/empty mistakes when unspecified, and list confidence/prerequisite/source findings without altering domain engines.

Bind source, whole corpus, catalog dependencies, implementation/policy and current asset eligibility hashes. Preserve versioned generations. Skip only after validating and comparing the actual cached proposal, keeping its timestamp; corrupted outputs regenerate. High confidence cannot grant editorial approval, import or publication. Asset candidates are metadata-only currently reusable exact-Concept matches.

## Consequences

Local sidecars are reversible and need no Pack schema/database change. Conservative dependency/asset invalidation regenerates more files but prevents false skips. Historical source pins require explicit reconciliation if corpus versions change. Missing metadata needs human review before pedagogical escalation; model routing receives compact exceptions. Admin UI, reviewed blueprints, enrichment/publication and production rollout remain separate later steps.
