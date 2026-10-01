# ADR 0020 — Use a shared versioned Question Bank

Status: Accepted

## Context

Questions are needed in Lessons, Practice, Review, Diagnostics and Simulations. Embedding copies in each context creates duplication and weak provenance.

## Decision

Introduce reusable versioned Questions linked to Concepts, provenance and exposure policy. Activities and Assessments reference Question versions rather than duplicating question content.

## Consequences

Question quality, exposure and analytics become centrally manageable. Attempt history can reconstruct exact question versions.

## Rejected alternatives

- embed all questions in Lesson payloads;
- generate questions synchronously for every session.

## Implementation constraints

Generated/derived questions must never be labeled official. Official question versions are immutable historical representations.
