# ADR 0025 — Gate publication through structured Content QA

Status: Accepted

## Context

AI-assisted content production can create factual errors, ambiguous questions and pedagogical gaps.

## Decision

Use structural, factual, pedagogical and IFSC-alignment QA with stored issues/severity. Authoring output cannot self-approve.

Content lifecycle includes draft/review/approved/published/retired states.

## Consequences

Publishing becomes slower but auditable. Deterministic validators run before expensive AI/human review.

## Rejected alternatives

- publish generated content after schema validation only;
- let the same generation call author and approve.

## Implementation constraints

Wrong or ambiguous answer keys block publication.
