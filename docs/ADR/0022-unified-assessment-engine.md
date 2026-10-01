# ADR 0022 — Use one Assessment Engine for diagnostics and simulations

Status: Accepted

## Context

Diagnostics, mini simulations, full simulations and official-exam runs share question delivery, frozen instances, response persistence and finalization.

## Decision

Use `AssessmentTemplate`, `AssessmentInstance` and `AssessmentResponse` with a `kind` field rather than separate engines.

## Consequences

Shared scoring/navigation infrastructure and fewer divergent code paths.

## Rejected alternatives

- DiagnosticEngine + SimulationEngine + ExamEngine.

## Implementation constraints

In-progress responses may be mutable; finalization must be idempotent and create immutable learning evidence exactly once.
