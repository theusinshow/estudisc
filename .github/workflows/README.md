# Workflows

Estudisc CI runs lint, typecheck, unit and build as separate fast jobs, followed by integration, content QA, Pack validation and critical E2E. All have finite budgets. E2E owns a fresh disposable server per browser project. Details: docs/migrations/ESTUDISC-CI.md.
