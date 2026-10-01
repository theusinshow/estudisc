# ADR 0028 — Add compatible caderno.track.v2

Status: Accepted

## Context

`caderno.track.v1` supports basic Tracks, Lessons, Concepts, Blocks and Activities but does not express curriculum requirements, prerequisites, Question Bank, sources and richer metadata required by IFSC.

## Decision

Keep v1 support and add `caderno.track.v2` with additive curriculum-aware capabilities.

## Consequences

Importer supports both versions. v2 needs semantic validation and fixtures. v1 content remains usable.

## Rejected alternatives

- mutate v1 semantics in place;
- abandon Packs and seed the database directly.

## Implementation constraints

Schema namespace remains `caderno.*`. Pack version/hash immutability rules continue to apply.
