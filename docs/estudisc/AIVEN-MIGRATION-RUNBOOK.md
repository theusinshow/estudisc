# Aiven migration runbook

Prepared 2026-10-09 after the user's request to continue. This is an execution checklist, not a completed restore or additional authorization to reveal credentials, erase data or switch production.

## Current evidence

- Authenticated system-Chrome inspection on 2026-10-09 confirms Aiven estudisc-postgres Running on Free-1-1gb, DigitalOcean sfo.
- Authenticated Neon Console confirms vecta-db / project dry-hat-96246996 / main branch br-restless-cell-b8hamo8w. It displays "Limit reached" and monthly network transfer exhaustion: 5.54 GB. Storage is approximately 55.5 MB. The current Free billing period is Oct 2 to Nov 1, 2026; the exact renewal timestamp is unverified.
- Both providers are authenticated in the system Chrome session. Authentication is no longer the blocker; the original network quota is.
- No complete original database backup has been verified. Source packs and V1 app exports do not restore all persisted history.
- pg_dump, pg_restore and psql were not found on PATH. Obtain compatible PostgreSQL client tools before execution; pg_dump must support the source server version.
- Existing postgres-js configuration has max=1 and prepare=false per process. Aiven Free allows 20 total connections, including provider use; this does not establish capacity for 20 app processes.

## Ordered execution

1. Recover source export access. The Console confirms network quota exhaustion; documented Free behavior suspends connections until renewal or upgrade. No documented free self-service export bypass was found. A free temporary allowance/export request requires explicit authorization before contacting Neon; a draft is ready in NEON-EXPORT-SUPPORT-DRAFT.md. Do not assume a restart or fork bypasses quota, or purchase an upgrade.
2. Confirm Aiven Running, exact Free plan and empty target. Verify source size plus indexes, disk overhead and headroom fit within the 1 GB target. Check server versions, extensions and effective connection capacity.
3. Arrange approved server-side credentials through a private secret channel. Do not put URIs/passwords into chat, Git, command arguments or captured output. Libpq service files and a protected passfile can supply connection parameters; keep any backup and private validation output under ignored .local/database-migration/ with restricted access.
4. Produce a complete trial custom-format dump. Include every application schema and the migration journal; separately inventory extensions, database role/grant dependencies, row counts, immutable published versions/hashes and owner-scoped append-only history. A logical dump does not automatically reproduce cluster-wide roles. Map database roles/grants explicitly without changing application owner IDs or audit records.
5. Check dump exit status, SHA-256 and archive listing. Restore only into the verified empty target, serially, stopping on error. Any partially restored target must be treated as incomplete, not activated.
6. Compare complete source/target table inventory, row counts, constraints, migration journal and canonical record hashes from a consistent source snapshot. Verify published version identities, Question provenance/reservations, Attempts, ConceptEvidence, StudyEvents, XP, review/publication audits, sessions/resumes and auth ownership. Do not import packs or recalculate mastery as a substitute.
7. Test the restored copy with exact production-compatible configuration: TLS, ADMIN/STUDENT isolation, published reads, reserved Question access, current sessions/resume and append-only writes. Keep test writes distinguishable and out of the final production snapshot. Run required repository acceptance for any code/config changes.
8. Before the final snapshot, quiesce all original writes and in-flight requests. Repeat complete dump/restore and comparisons against that final consistent snapshot. Retain the original database and verified backup.
9. Only after authorized secret configuration/cutover, update the production database connection and deploy. Confirm actual application reads/writes and observed connections/errors. Do not claim recovery solely from HTTP 200 or the fallback UI.
10. Keep writes paused until verification permits reopening. A rollback after new target writes needs explicit reconciliation of those writes; switching back blindly can lose history. Never destroy the original during this migration.

## Command templates

These commands are not executed yet. PGSERVICE resolves connection parameters from a private libpq service file; passwords remain in its protected passfile. Paths assume the ignored migration directory already exists. The source template must use a direct, read-capable connection.

```powershell
pg_dump --dbname="service=estudisc-source" --format=custom --file=".local/database-migration/source.dump"
Get-FileHash -Algorithm SHA256 -LiteralPath ".local/database-migration/source.dump"
pg_restore --list ".local/database-migration/source.dump"
pg_restore --dbname="service=estudisc-target" --no-owner --no-acl --exit-on-error --single-transaction ".local/database-migration/source.dump"
```

The restore template deliberately omits provider-specific original database owners/grants; verify and apply the approved target permissions separately before activation. It preserves the application row identities. Do not use --clean, drop the source, or run migrations/imports that transform existing state.

## Sources and validation

[Aiven dump/restore guide](https://aiven.io/docs/products/postgresql/howto/migrate-pg-dump-restore) requires stopping source writes for the final migration. [Aiven Free limits](https://aiven.io/docs/products/postgresql/concepts/pg-free-tier) and [connection limits](https://aiven.io/docs/products/postgresql/reference/pg-connection-limits) establish the target constraints. [PostgreSQL pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html) documents archive listing, permission options and single-transaction restore. ADR 0002 retains PostgreSQL/Drizzle; ADR 0014 prohibits substituting application export replay for this full data-preserving restore.

[Neon's official Free quota FAQ](https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md) confirms that exhausted network transfer suspends existing/new connections until allowance renewal or upgrade, without deleting data. The account's actual quota banner and billing period above were verified separately in the authenticated Console.

Executed preparation: bounded Console reads, Get-Command pg_dump,pg_restore,psql, inspection of src/db/connection.ts, and git diff --check. No data export, restore, credential read or production switch has occurred.
