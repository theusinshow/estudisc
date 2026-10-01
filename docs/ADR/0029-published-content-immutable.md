# ADR 0029 — Published educational content versions are immutable

Status: Accepted

## Context

Attempts, assessments and evidence must remain interpretable after content corrections.

## Decision

Once a Lesson or Question version is PUBLISHED, edits create a new version. Historical references remain attached to the original version.

## Consequences

Storage grows modestly and editorial workflows require version creation. Historical reconstruction becomes reliable.

## Rejected alternatives

- edit published rows in place;
- snapshot full content into every Attempt.

## Implementation constraints

Retirement hides content from new selection but does not delete versions referenced by learning history.
