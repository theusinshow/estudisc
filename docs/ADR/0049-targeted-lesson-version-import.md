# ADR 0049 — Targeted immutable lesson-version append

Status: Accepted for implementation, 2026-10-07.

## Contract

Add `caderno.lesson.v2` without changing existing Track/v1 Pack schemas. The packet carries a unique Pack receipt ID/version, declared content author, exact Track stable ID/version/module/lesson/base version/hash, one next-version draft lesson and immutable existing Question ID/version/hash references. Initial scope is block enrichment: retain all source fields, Concepts, prerequisites, Activities, exit tickets and old blocks in order; add validated blocks only. No Question/source/curriculum changes or reserved/annulled training references.

## Persistence and projections

Resolve the current imported v2 context in the target collection and compare the exact base lesson/hash. SQL apply locks the existing Track, rechecks receipt and global lesson-version conflicts, validates persisted Question hashes/availability and source membership, then inserts only one Lesson with its blocks/Activities/Concept links and a new draft release/receipt. No Track/module/Question/Concept inserts, original-row updates or learner writes. Unique receipt and lesson indexes plus transactional rollback cover races; dry preview writes nothing. Memory follows the same receipt/context rules without duplicating unversioned store arrays.

The receipt manifest is a validated materialized Track-v2 **read projection**, containing the existing collection with only the target lesson substituted and a `lessonVersionImport` metadata envelope retaining the original targeted packet. The receipt table schema remains caderno.lesson.v2. This private context snapshot is not a corpus import or new Track. Existing bundle/planner/frozen-version readers can read it; original manifests remain available. Projected Track payloads cannot enter ordinary Track import. Track/module pointers remain unchanged. Import timestamps are assigned after the Track lock using database clock/max-receipt timestamp, so transaction-start times cannot reorder serialized context snapshots.

Current learner reads select the latest published lesson; ADMIN can preview the draft. Explicit old versions and frozen sessions keep original records/manifests. Track lists deduplicate version rows and count only the selected version's Activities. Publication uses existing authenticated Admin Direct under ADR 0048; no fabricated QA or automatic publication during import.

## Migration and compatibility

No DDL/backfill: existing receipt, scoped lesson-version, content release and relation tables suffice. New writes are additive. Legacy Track/lesson-v1 imports retain behavior. Projection exports are read snapshots: replay the retained targeted packet through its endpoint, never replay them as Track imports. Test migration/fixtures, SQL/memory parity, stale source/version, forged refs, duplicate/global versions, concurrent receipts, rollback, current-vs-historical reads and direct-publication evidence. Production activation remains a real authenticated operation after engineering gates, not an implied receipt.

CI source compatibility: add an exact-byte canonical Mathematics source mirror under packs/drafts, replacing the ignored .local-only input path in the blueprint loader. Its normalized hash remains the previously audited bcf7c8… value and raw SHA remains 2eb7f1…; all 240 Questions are generated/unreserved with no Question assets. This is repository fixture/context availability, not a content import, republication, licence promotion or source modification. Other canonical sources and the original local audit artifact remain unchanged.
