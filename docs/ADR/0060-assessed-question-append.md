# ADR 0060 — Targeted assessed Question append

Status: Accepted for the bounded MAT-16 circle-measure increment, 2026-10-11.

## Context

ADR 0049's `caderno.lesson.v2` deliberately preserves the exact original
Question-reference set and all Activities. That is correct for block-only
enrichment, but it prevents a new immutable lesson version from binding a
small number of independently scored retrieval Questions through the existing
Question/Attempt pipeline.

## Decision

Add `caderno.lesson.v3`, a targeted immutable append packet. It keeps v2 and
ordinary Track imports unchanged. A v3 packet identifies the same published
base Track/module/lesson/hash and carries the full next draft lesson, exact
retained and appended Question references, and at most twelve new Questions.

- Retain all base fields, blocks, Concepts, exit tickets, source Question
  refs/hashes and Activities exactly. New blocks still follow ADR 0049's
  existing-renderer rule. Append Activities only after the retained prefix;
  each must be a `question` Activity for exactly one newly supplied Question.
- New Questions are version 1, draft, non-official, non-derived,
  non-reserved training content with no assets. Their Concepts and sources
  must already be in the retained lesson/Track context. Their question
  content is validated by the shared Question schema and their reference hash
  is canonical. The packet does not create sources, Concepts, answer engines,
  or a special assessment registry.
- SQL locks the Track, rechecks the idempotent receipt, the current published
  base lesson/release, retained Question availability and global new Question
  identities. One transaction stores the projection receipt, shared Question
  versions/concept/source links, draft lesson/version Activities and content
  releases. A failure rolls all of them back. Memory uses the same validation
  and atomic projection semantics.
- Question release authors follow ADR 0033 provenance; lesson authors use the
  packet's declared author. Existing authenticated Admin Direct publication
  publishes the new Question and lesson bundle together under ADR 0048. No
  Reviewer evidence is manufactured. Preview writes nothing; a same receipt
  is idempotent and differing content/schema is a conflict.

The existing `question` Activity/QuestionPanel endpoint remains the only
scored interaction. Its normal immutable Attempt and append-only evidence
rules apply only to a submitted Question. Exploratory blocks remain local
checks and never become evidence by this ADR. Frozen sessions retain their
explicit prior lesson version; current lesson reads select the newly published
version only after real Admin Direct publication.

## Compatibility and release

No DDL or backfill is required. Legacy v2 packets retain their exact guards;
v3 projections remain `caderno.track.v2` read snapshots and cannot be replayed
through Track import. Fixtures cover v2 compatibility, retained hash/activity
conflicts, new Question provenance/reservation/identity guards, preview,
idempotence, transaction rollback, SQL/memory parity, release bundling and
old-version reads. MAT-16 production use requires fresh actual context/preview
and normal authenticated Admin Direct evidence; source, rights and official
mapping caveats remain visible.

## Rejected alternatives

- Weakening v2 to accept changed Question refs or Activities.
- Re-importing the full Track/corpus.
- Recording an educational-block check as an official Attempt.
- A parallel Question/evaluator/mastery/publication path.
