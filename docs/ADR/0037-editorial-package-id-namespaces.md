# ADR 0037 — Namespace colliding editorial package identities

Status: Accepted locally, 2026-10-05.

The supplied GH V2 package reuses existing Lesson IDs for different subjects: GH-02 means Cartography in this package and Santa Catarina peoples in the current Week 1. Importing these as newer versions would replace the meaning of existing references and could misattribute learner progress.

Use GH-V2-01 through GH-V2-49 for imported Lessons and the same prefix for their blocks, Questions and activities. Preserve every original ID and record in immutable source and the editorial sidecar, with an explicit original-to-runtime map. Reuse only compatible canonical Concepts; retain other editorial atoms with explicit new dispositions pending human taxonomy review. Existing Lesson versions, Questions, Concept definitions and learner state remain unchanged.

This is an adapter policy using the existing Pack v2 schema, not a schema migration or new engine. Future sources with identity collisions must receive their own explicit namespace; do not merge by matching title or ordinal. The cost is an extra ID mapping; the benefit is preserving semantic identity and immutability. Renumbering existing lessons or treating unrelated topics as revisions is rejected.
