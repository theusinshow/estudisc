# ADR 0023 — Preserve official exams and control exposure

Status: Accepted

## Context

Historical Integrated exams are scarce high-value benchmark material. Premature exposure degrades their usefulness.

## Decision

Store official questions with immutable provenance and explicit exposure policy. Reserve 2026.1 for intermediate benchmark and 2026.2 for final benchmark until release. Mark annulled items explicitly.

## Consequences

Question selection must check exposure/reservation state. Admin needs clear reservation controls.

## Rejected alternatives

- use all official questions immediately for training;
- rewrite official items into “cleaner” versions.

## Implementation constraints

2025.1 Q15 is annulled and cannot score or emit mastery evidence.
