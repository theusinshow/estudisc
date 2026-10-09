# Database recovery — 2026-10-09

## Verified recovery

The user explicitly authorized temporary Neon Launch reactivation at the verified usage rates ($0.106 per CU-hour and $0.35 per GB-month), private database connection handling, complete backup/restore and validated cutover to Aiven Free. No automatic maximum spending cap was promised.

The Vercel CLI updated only the existing Neon installation icfg_nVgVV9mno2ZrjEzrE24jDAef to launch_v3. A separate authenticated configuration read confirmed Launch. The original database then accepted a real SQL query; server version is PostgreSQL 18.6. Production project lab-estudisc / prj_VBKhxBJZnU7BHLSCXeBHloXFxmHr, team theusinshows-projects, repository estudisc and deployed commit 62e6bf1dfb6e8344037c676432c4cf08b5f86bd9 were verified before handling its connection.

Actual production health: https://vecta-three.vercel.app/api/health/db returned HTTP 200 and status ok at 2026-10-09T16:30:42.109Z. This endpoint executes a real database SELECT. It confirms restored backend connectivity, not an Aiven cutover or authenticated student-flow acceptance.

## Complete preliminary backup

- PostgreSQL custom-format dump completed successfully and its archive listing was checked.
- Dump size: 4,180,748 bytes; SHA-256 EBD070CA01E9BBE4C51FA84A08E1B047EB867BE772CAE9DD68FBCD5107575250.
- Database size from PostgreSQL: 31,490,048 bytes. Earlier Console storage around 55.5 MB measures a different provider metric; both are below 1 GB, but final restored size/headroom must still be measured.
- Read-only inventory: 59 tables across public, drizzle and neon_auth; 30,091 rows; migration journal 21 records; 106 Attempts, 127 ConceptEvidence, 129 StudyEvents, 1,443 content release records, 154 historical Lesson rows and 1,284 QuestionVersion rows.
- Historical row counts are not a count of newly published/current lessons or Questions. No corpus import, publication or history reconstruction occurred.
- The dump, row hashes, schema inventory and original application connection are stored only in ignored .local/database-migration/private with Windows permissions restricted to the current user. No raw connection/password, dump contents or private record was printed or committed.

This is a consistent preliminary pg_dump snapshot. The later inventory was collected in its own read-only repeatable-read transaction while the app could still write. It is not the final frozen cutover snapshot; quiesce original writers and repeat the dump/inventory before final comparison.

## Local migration preparation and acceptance

Official portable PostgreSQL 18.6 tools were downloaded from the archive linked by PostgreSQL.org/EDB and installed under ignored .local/postgresql-client, without a system installer/service. Archive SHA-256: E2246BA91D22345BC3D017586C09EDE52D9DF180B1EEB480F050445F1CAD84E2.

Commands completed:

- .local/postgresql-client/bin/pg_dump.exe --version
- .local/postgresql-client/bin/pg_restore.exe --version
- .local/postgresql-client/bin/psql.exe --version
- pnpm test:postgres — PASS against an isolated local PostgreSQL instance, applying checked-in migrations and verifying RUN/SUBMIT behavior.
- node .local/database-migration/rehearsal-20261009/roundtrip.mjs — PASS for synthetic data only: 21 migrations, 52 tables, identical row counts/hashes after dump/restore and preserved identity sequence progression. Initial rehearsal setup lacked the portable lib DLLs; these were extracted from the same official archive. The initial manifest used an incorrect schema-qualified identifier; it was corrected before the successful rehearsal. No production data was used in that rehearsal.
- pnpm lint — PASS.
- pnpm typecheck — PASS.
- pnpm test — 447 PASS / 3 optional SKIP; the real PostgreSQL smoke above was run separately and passed.
- pnpm packs:verify — PASS.
- pnpm build — PASS, with existing environment-alias and Content Studio broad filesystem tracing warnings. No local build or private files will be uploaded; a production redeploy must use the existing Git-backed deployment.
- pnpm test:e2e — serial default Chromium/mobile confirmation PASS: 29 PASS / 19 gated SKIP in each browser (58 PASS / 38 SKIP overall). Existing accessibility, responsive, auth UI, history and RUN/SUBMIT flows remain passing. No UI implementation was changed.
- git diff --check — PASS. Build/dev regenerated next-env.d.ts and normalized generated CSS line endings; only those task-generated changes were restored after browser testing. No application source changes remain.

## Remaining migration work

Aiven estudisc-postgres was verified Running on Free-1-1gb. Its connection has not yet been obtained; no desktop browser currently appears in the automation session. The user was asked to reopen authenticated Aiven in system Chrome, without sending a password in chat.

After that access: verify the exact empty target, TLS and compatibility; restore and validate the full trial backup; quiesce original writers; collect a final complete snapshot and inventories; restore/compare all tables, constraints, indexes, policies, schema and migration journal; update the approved database connection only; redeploy the exact Git-backed code; verify production and auth boundaries; then return the original Neon installation to Free when safely supported. Keep the original data and private backup intact.

No Aiven restore, production connection change, pause/delete operation, paid Aiven resource or Neon downgrade has occurred yet. Neon is currently Launch, so temporary usage billing remains active while recovery/migration continues.
