# Free PostgreSQL alternatives — Estudisc

Evaluation date: 2026-10-08. User explicitly requested evaluating a free alternative after the production quota interruption. This document recommends a path; it is not authorization to create accounts, handle new secrets, switch production or discard existing state.

| Option | Current free offer | Main fit / constraint |
|---|---|---|
| Aiven PostgreSQL | Indefinite free plan, no credit card; one node, 1 CPU, 1 GB RAM, 1 GB disk, backups; 20 connections | Closest direct PostgreSQL replacement with a fixed small instance. No included connection pool/SLA/support; may power off unused services after notification. Verify actual database size and Vercel concurrency before choosing. |
| Supabase PostgreSQL | 500 MB database on Free | Compatible PostgreSQL, but low-activity projects can pause over a seven-day window. App uses server-side PostgreSQL and existing private auth; do not expose private public-schema tables through a new Data API or replace auth casually. |
| Keep existing service after quota restoration | Existing data/IDs remain in place | Fastest recovery if the account can regain access. Actual quota/reset date must be confirmed through an authenticated console; the SQL message alone does not determine reset timing. |

Primary current sources: [Aiven free tier](https://aiven.io/docs/products/postgresql/concepts/pg-free-tier), [Aiven connection limits](https://aiven.io/docs/products/postgresql/reference/pg-connection-limits), [Supabase pricing](https://supabase.com/pricing), [Supabase pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Neon plans](https://neon.com/docs/introduction/plans). Avoid time-limited trials as the production solution for this social project.

Recommendation: evaluate Aiven first for the existing modest private ADMIN/STUDENT scope, conditional on actual size below its disk limit and connection demand within 20. The application already uses standard postgres-js/Drizzle with max one connection per process and prepare=false. This is code compatibility evidence, not a measured production concurrency/size guarantee. Multiple Vercel processes can exceed a provider-wide limit even with max=1, so verify deployment concurrency and compatible pooling before activation. Free service availability is not guaranteed.

## Data-preserving transition

The current blocker is access to the original complete database. No full PostgreSQL dump was located in the targeted local backup/dump filename inventory; schema snapshots and source content are not a complete production backup. Existing V1 app exports are owned portability data, not a full physical restore of all append-only user state; ADR 0014 forbids silently replaying/overwriting historical evidence. Do not restore only the 132 source lessons and present the user history as preserved.

Before switching: obtain an authenticated account session and a complete verified original dump or a provider-supported snapshot export; verify size/row counts/table/version/hash inventory; restore to a new empty PostgreSQL target while retaining IDs, immutable versions, append-only Attempt/evidence/events/XP, actual review/publication audits, assets/reservations and migration journal. Test auth isolation, Questions/reservation, active-session snapshots, backup and real migrations on that restored copy. Keep the old database intact; only then perform a explicitly authorized reversible connection cutover. New credentials must stay server-side and be configured through the approved secret channel, never in chat or Git.

No paid service, new provider account, migration, source re-import, support message or production connection switch was performed. The two validated source-goal candidates remain pending; after restoration, recheck actual current source/version/hash before preview/import/Admin Direct publication.
