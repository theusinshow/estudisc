# ADR 0019 — Map official curriculum requirements explicitly

Status: Accepted

## Context

Lesson titles cannot prove complete coverage of an external exam syllabus.

## Decision

Add `CurriculumRequirement` and mappings to Concepts. Represent prerequisite relationships between Concepts and track-specific curriculum importance.

Coverage states are explicit: UNMAPPED, MAPPED, COVERED, VALIDATED.

## Consequences

The system can report syllabus completeness deterministically and detect gaps even when content exists under misleading titles.

## Rejected alternatives

- infer coverage from lesson names;
- rely on AI reviewer memory;
- use historical exam frequency as the curriculum.

## Implementation constraints

Historical exams may influence priority/style but may not delete a current official requirement.
