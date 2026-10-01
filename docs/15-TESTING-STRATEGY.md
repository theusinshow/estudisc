# 15 — Testing Strategy

## IFSC invariant coverage

Add tests for idempotent submission/finalization with exactly-once evidence, v1/v2 Pack compatibility, immutable published/history versions, deterministic assistance-weighted mastery, review failure intervals, derived curriculum coverage, frozen ACTIVE sessions, private owner/role isolation, reserved-question exclusion and annulled no-score/no-evidence behavior. Golden fixtures: MAT-07, POR-01, CIE-06, GH-06. Test student critical paths mobile first, without hover/drag dependence or color-only status. Use migrated disposable PGlite, memory UI harness and full baseline checks. Never apply production migrations through a test gate.

## Test pyramid

### Unit

Domain policies, mastery calculation, review scheduling, validators, diff logic, ID/version rules and runtime serialization.

### Integration

Database repositories, atomic imports, content/user-state separation, attempt creation, event emission and migrations.

### Component

Activity renderers, accessible controls, state feedback and responsive recomposition.

### End-to-end

Critical user journeys using Playwright.

## Mandatory invariant tests

- Importing the same Pack version twice creates no duplicate content.
- Updating content preserves attempts and user progress.
- Failed imports leave no partial data.
- RUN creates no Attempt or XP transaction.
- SUBMIT creates exactly one immutable Attempt.
- Mastery is explainable from stored evidence.
- Append-only records cannot be silently updated through normal repositories.
- Code runtime timeout and output limits work.
- State is understandable without color.

## Quality gates

Every PR should run the narrowest relevant tests during development and all configured baseline checks before completion: lint, typecheck, unit tests and build. E2E runs for affected critical flows.

## Fixtures

Pack fixtures live under `packs/examples/` and must include valid, invalid, duplicate, update and conflict cases as the importer is implemented.
