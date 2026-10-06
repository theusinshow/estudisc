# ADR 0035 — Curated sources reuse Content Studio contracts

Status: Accepted (user-authorized local library bootstrap, 2026-10-02)

## Decision

Keep the local source library in `vecta-source-library/`. Its machine catalog is the existing Studio SourcePack wrapping runtime ContentSource. Typed librarian fields extend the existing `ContentSource.metadata.library` slot without changing runtime/Pack or Studio schemas. Media uses Studio MediaPack; incomplete media metadata stays in the source record until the existing required fields are known. Subject/media indexes and curriculum taxonomy are derived references. Bootstrap adds no internet resources or lessons.

## Tradeoffs and consequences

One canonical identity avoids duplicate subject catalogs and competing source/media contracts. The existing contract remains import-compatible, while a dedicated validator checks curation metadata, URL/resource duplicates and actual Concept references. A curated source is not publication approval or verified official curriculum coverage. License uncertainty and inaccessible resources remain in the inbox; provenance/history survives broken links and archival. Unknown video duration does not force a fictional MediaPack candidate.

Existing Pack/job source provenance is not migrated or renamed by this bootstrap. Librarian intake must check those records before allocating an identity. No database, Pack schema, runtime renderer or production migration changes. Official reservation policy and human editorial gates remain authoritative.

## Alternatives

A separate resource schema duplicated ContentSource/Studio provenance. A catalog per subject duplicated physical records and complicated ID stability. Automatically ingesting seed sources would imply verification that this bootstrap did not perform. These alternatives were rejected.
