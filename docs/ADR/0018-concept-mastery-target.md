# ADR 0018 — Concept remains the atomic mastery target

Status: Accepted

## Context

The design exploration considered adding a separate `Skill` aggregate. The existing repository already stores append-only ConceptEvidence and deterministic Concept mastery.

A second mastery target would duplicate relationships and require broad migration.

## Decision

Keep `Concept` as the atomic, measurable learning target. Editorial Concepts must be granular enough to represent observable capabilities.

Example: Percentage is a Lesson/topic grouping; atomic Concepts include calculating percentage, converting representations and interpreting discount problems.

## Consequences

Existing ConceptEvidence/mastery/review infrastructure remains valid. Curriculum design must avoid overly broad Concepts.

## Rejected alternatives

- add Skill and migrate mastery to Skill;
- keep broad Concepts and store hidden subskills in JSON.

## Review trigger

Revisit only if a future domain requires evidence relationships that cannot be modeled cleanly with atomic Concepts.
