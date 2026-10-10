# Aiven migration — actual production cutover

Completed database cutover on 2026-10-10. The Estudisc production alias uses the existing application code on Aiven PostgreSQL Free. The original Neon installation was independently verified back on Free; its data and the complete private backup remain intact. [Machine-readable receipt](AIVEN-MIGRATION-RELEASE.json).

The durable hosting choice and scope/limits are recorded in [ADR 0059](../ADR/0059-aiven-free-production-postgresql.md).

The authenticated Aiven Console confirmed estudisc-postgres / Free-1-1gb. It had powered off from initial inactivity; the existing free service was restarted, without a paid upgrade. Its connection was acquired through the authenticated UI directly into the restricted private directory, never into chat/Git. Initial DNS absence cleared when service rebuilding finished.

## Copy and consistency verification

The provider default database used libc/en_US.UTF-8 while the original used builtin/C.UTF-8. A new logical target database was created with template0, UTF8 and the original locale/provider. A disposable empty trial database initially inherited OS locale fields; it was checked, removed while still empty and recreated using the explicit LOCALE option before any data restore. [PostgreSQL CREATE DATABASE](https://www.postgresql.org/docs/18/sql-createdatabase.html) documents this behavior. The original database and provider default database were not dropped.

Trial and final dumps were each coupled to a read-only repeatable-read inventory using a shared exported PostgreSQL snapshot. The final snapshot covered all 59 tables / 30,091 records, including the public, drizzle and neon_auth schemas. Both restores passed full comparisons of table rows/hashes, columns, constraints, indexes, policies, sequences, triggers, functions, extensions, locale/encoding and large objects. Final restored database size was 30,725,823 bytes; final dump was 4,180,972 bytes, SHA-256 8c3023bc04f04310c44e5b1de9d81111a0017b6e55ee718271bff36a10ed5964.

Restores used --no-owner and --no-acl to map provider database ownership to the existing Aiven administrator rather than recreate Neon platform roles. Application owner IDs, persisted permissions/provenance, immutable versions and every historical row were retained. No lesson pack replay, new official Attempt, evidence weighting, mastery recalculation or source rewrite occurred.

For the final copy, production was briefly paused and the original application database role was made read-only. Existing transactions were allowed to settle before any idle app connections were closed. This prevents old deployments from writing divergent history. The source remains protected as a retained backup.

## Deployment and live checks

Only the existing DATABASE_URL variable value was changed; its existing production/preview/development targets were retained. Other authentication/configuration/feature variables were not changed. The [documented environment update API](https://vercel.com/docs/rest-api/projects/edit-an-environment-variable) was used with a private body file. The deployed code remains commit 62e6bf1dfb6e8344037c676432c4cf08b5f86bd9; no local build, backup, secrets or private browser artifacts were uploaded.

The first redeploy was BLOCKED because the project was paused, confirmed by Vercel readyStateReason. The platform pause was removed while the original role stayed read-only; a new Git-backed redeploy then reached READY. Production alias and project ownership were verified against dpl_FTN5bU7Mgb9gynsBxxenDro3dE6H.

Actual /api/health/db returned HTTP 200 / ok on the new deployment, an application connection was observed in Aiven, and a temporary SQL write succeeded and was rolled back without touching learning tables. Anonymous /api/profile correctly returned HTTP 401 / auth_required from the existing proxy. An initial check expected 403; source inspection confirmed that 401 is the specified unauthenticated response, rather than a regression.

Neon was then switched to free_v3. The first immediately following plan read was transitional/empty; a subsequent independent read confirmed Free. Production health remained HTTP 200 / ok afterward. The original database remains readable/read-only at observation time; no particular provider quota-reset behavior is assumed.

## Validation commands

Private connection values stayed in protected files/libpq services. Relevant commands (all paths relative to the repository):

```text
node .local/database-migration/private/target-preflight.mjs
node .local/database-migration/private/snapshot.mjs trial-20261010
node .local/database-migration/private/create-target.mjs estudisc_migration_trial
.local/postgresql-client/bin/pg_restore.exe --dbname=service=estudisc-trial --no-owner --no-acl --exit-on-error --single-transaction .local/database-migration/private/trial-20261010.dump
node .local/database-migration/private/compare-target.mjs trial
node .local/database-migration/private/create-target.mjs estudisc
node .local/database-migration/private/source-freeze.mjs freeze
node .local/database-migration/private/snapshot.mjs final-20261010
.local/postgresql-client/bin/pg_restore.exe --dbname=service=estudisc-final --no-owner --no-acl --exit-on-error --single-transaction .local/database-migration/private/final-20261010.dump
node .local/database-migration/private/compare-target.mjs final
vercel redeploy dpl_6z4wvwwJwex7EnRmWA3taRnZRXZz --target production --no-wait --scope theusinshows-projects --non-interactive
vercel integration update neon --installation-id icfg_nVgVV9mno2ZrjEzrE24jDAef --plan free_v3 --scope theusinshows-projects --non-interactive --format json
git diff --check
```

The unchanged application had already passed the full 447-test, 58-browser-test, lint/typecheck/build/packs and separate real-PostgreSQL acceptance recorded in DATABASE-RECOVERY-2026-10-09.md. This increment validated the actual complete dataset on the actual target; those application checks were not repeated without source changes.

## Remaining independent work

The fresh browser app tab requires its normal private profile sign-in. Authenticated UI acceptance and the prepared CIE-03/POR-02 Admin Direct activations are pending that session; they are not editorial approval requests. The source-bound candidates were revalidated but have not been imported or published. Broader lesson enrichment remains a distinct unfinished content lane.

Free capacity remains 1 GB / 20 total connections and the provider can power off unused services. Monitor actual activity and connection demand; no SLA or unlimited-capacity promise is made. The pre-existing Aiven Developer service was not modified by this migration. Paid usage accrued during the authorized temporary Neon recovery may still appear in billing; its current plan is Free.

Retain the original database and private dump. After new target writes, a rollback requires reconciling those writes before restoring source writability; switching back blindly would lose newer history. No automatic data replay/merge is provided.
