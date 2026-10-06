# Migrations

Generated Drizzle migrations live here. Do not commit disposable local database state.

Use these commands:

```text
pnpm db:generate
pnpm db:migrate
pnpm test:postgres
```

`pnpm db:migrate` requires `DATABASE_URL` to point at the target PostgreSQL database. Do not run it against production without confirming the target environment and backup/rollback plan.

`pnpm test:postgres` is the non-destructive real-PostgreSQL validation path. It uses `TEST_DATABASE_URL` or `DATABASE_URL`, creates a temporary `estudisc_real_pg_*` schema, applies the checked-in migrations there, runs a minimal repository smoke, and drops that schema afterward. The harness rebinds generated `"public".*` foreign-key references to the disposable schema during the test so the production `public` schema is not touched.
