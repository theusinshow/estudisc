# ADR 0045 — Teaching-asset metadata without transferring protected storage

Date: 2026-10-07. Status: Accepted for local metadata/authoring implementation. Extends ADRs 0032/0044 and canonical Studio MEDIA-POLICY. No production publication or asset generation.

## Decision

Extend existing Media Pack image candidates with optional teaching-asset metadata: explicit content version/type, subjects/Concepts/tags, dimensions/text equivalent, reusable/interactive-ready intent, rights-evidence reference and exposure classification. Omitted metadata stays omitted when parsing old artifacts; no automatic license/status/reuse approval or historic hash rewriting.

Keep actual declared license status, verification date, source/attribution and produced safe bytes as distinct facts. Reuse requires APPROVED_EMBED, existing verified rights/source/attribution, safe produced data URI, explicit reusable intent/evidence and teaching exposure. Unknown, link-only, review/rejected, unproduced, stale/hash-mismatched or protected Question assets are ineligible. Interactive readiness is declared editorial intent with a usable text equivalent, not pedagogical certification.

Build/search a local metadata-only version/hash inventory from the existing Studio workspace. Do not copy bytes, private Question storage, reserved original source documents or user state into public/static assets. Source-artifact and content/metadata hashes bind selection; changing rights while preserving bytes invalidates stale selection. Existing Studio workspace/symlink boundaries remain the file access boundary. No new storage/provider/API/auth/CSP boundary.

Embedding checks cover every visual source through existing provenance/media records: primary figures, comparison second images, hotspot and authored-map images. Each source needs its own matching produced candidate, APPROVED_EMBED and preserved attribution; a licence-cleared primary cannot clear a second image or an entire composite.

## Compatibility and rollout

No learner Pack envelope, database migration or content backfill. Existing per-job candidate/figure workflows remain; new reusable selection is a local authoring consumer. Admin library UI and production distribution may follow only once their approved catalogue/storage consumer is concrete. No fictitious independent review; actual source/editorial/publication caveats remain visible. Private official asset reads stay in the existing authorized Question service and are never auto-indexed here.
