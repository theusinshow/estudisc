# ADR 0017 — IFSC extends the existing KNOW/OS core

Status: Accepted

## Context

KNOW/OS already contains a working learning core: Tracks, Lessons, Concepts, Blocks, Activities, Attempts, ConceptEvidence, deterministic mastery/review, import/versioned Packs and production infrastructure.

Creating IFSC-specific parallel engines would duplicate state and create conflicting sources of truth.

## Decision

Implement IFSC as a Track/domain expansion on the existing core. Extend generic feature modules only where a reusable capability is missing.

Do not create IFSC-specific replacements for Lesson Renderer, Activity Registry, mastery, review, auth, import or deployment.

## Consequences

Implementation is smaller and historical compatibility is preserved. Some existing generic contracts must be extended.

## Rejected alternatives

- separate IFSC application;
- parallel IFSC mastery/review system;
- independent content runtime.

## Implementation constraints

Any hardcoded `if (track === "ifsc")` domain logic requires justification. Track-specific data/configuration is preferred.
