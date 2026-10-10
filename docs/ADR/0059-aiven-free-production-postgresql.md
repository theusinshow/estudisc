# ADR 0059 — Use Aiven Free for the current private production database

Status: Accepted
Date: 2026-10-10

## Context

The original Neon Free project exhausted its monthly network transfer allowance and suspended database access. The user selected Aiven Free for this social project and explicitly authorized temporary paid source recovery, private connection handling, a complete verified restore and production cutover. The complete production dataset is modest: approximately 31 MB and 59 tables. PostgreSQL/Drizzle and the modular-monolith contracts from ADR 0002 remain authoritative.

## Decision

Use the existing Aiven estudisc-postgres service on Free-1-1gb and the logical database estudisc for the current private ADMIN/STUDENT scope. Preserve PostgreSQL 18.6, UTF8/builtin C.UTF-8, all persisted rows/identities and the existing postgres-js/Drizzle repository boundaries. Keep the connection server-side in the existing DATABASE_URL variable; do not introduce a second application data engine, content replay or automatic evidence/mastery merge.

Cutover requires full logical snapshots coupled to consistent inventories, exact data/schema comparisons, protected original writers, verified deployment/alias and actual target health/access checks. Provider SQL ownership maps to the existing Aiven administrator; application identity, ownership, immutable versions and authorization remain unchanged. Retain the full private dump and the original Neon database read-only on its independently verified Free plan.

## Consequences

The application database runs on the selected Free service with 1 GB disk, 1 GB RAM, one CPU and 20 total connections. Free lacks connection pooling and an SLA, and inactive services may be powered off. Monitor actual storage/connection demand; max=1 per app process is not a provider-wide concurrency guarantee. This decision is not approval for an expanded public SaaS or unbounded capacity claim.

Temporary authorized Neon usage may still be invoiced; its current plan is Free. The pre-existing Aiven Developer service is outside this migration and was not modified. After new target writes, returning to the old database requires an explicit reconciliation plan; blindly switching back would lose newer history.

## Validation / review trigger

[Actual migration receipt](../estudisc/AIVEN-MIGRATION-RELEASE.md) records complete trial/final comparisons, live target connectivity and the unchanged code deployment. Revisit if measured demand approaches provider limits, inactivity affects service availability, identity/security contracts change, or the product's approved scope expands. Any destructive migration, canonical evidence transformation or new paid hosting requires the applicable existing authorization/review boundaries.
