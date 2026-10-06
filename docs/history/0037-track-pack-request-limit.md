# ADR 0037 — Allow Track Pack imports up to 2 MiB

Status: Accepted

## Context

The user authorized increasing the request limit to import the complete History/Geography v2 collection as one Track Pack. Its unchanged educational projection is about 1.2 MiB and exceeds the previous 1 MiB limit. Splitting it creates extra collections solely for transport.

## Decision

Set MAX_TRACK_PACK_BYTES to 2 MiB and explicitly use it for POST /api/import/track and POST /api/import/track/preview. Preserve the generic JSON reader's default 1 MiB limit and all explicitly configured restore limits. Keep both declared Content-Length and actual UTF-8 byte checks, JSON/schema/semantic validation, authorization and HTTP 413 behavior.

## Consequences

Each Track Pack request may allocate more memory while remaining bounded at 2 MiB. Pack schemas, lesson/question versions, figure limits and learning rules do not change. Existing smaller packs stay compatible. Deploying the runtime change requires the repository's explicit production authorization; local implementation alone does not change the live limit.

## Alternatives

Two collections based on source units preserve content but fragment the requested collection. Removing teaching text or weakening validation would violate source fidelity. Unlimited bodies remove the existing request bound. The scoped 2 MiB increase preserves a single collection with a small, reversible change.
