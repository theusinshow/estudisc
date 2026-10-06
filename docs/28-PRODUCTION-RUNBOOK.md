# 28 — Production Runbook

Date: 2026-07-30

## Status

This runbook prepares Estudisc for the selected production stack from ADR 0015:

- Vercel hosting.
- Neon Postgres.
- Auth.js with Google OAuth.

It does not authorize external resource creation, deployment or secret handling by an autonomous agent. Those actions require explicit user confirmation.

## Step 1 — GitHub source

Repository:

```text
https://github.com/theusinshow/estudisc
```

Current branch:

```text
main
```

Before any deployment attempt:

```text
git status --short --branch
git log --oneline --decorate -1
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm security:audit
pnpm build
```

## Step 2 — Neon Postgres

User action required:

1. Create or select a Neon project.
2. Create a database for Estudisc.
3. Copy the PostgreSQL connection string.
4. Store it as `DATABASE_URL` in Vercel project environment variables.

Do not commit the connection string.

Local validation, only after the user provides a disposable or intended target `DATABASE_URL`:

```text
pnpm test:postgres
pnpm db:migrate
```

`pnpm test:postgres` creates a uniquely named disposable `estudisc_real_pg_*` schema, applies the checked-in migrations inside that schema, runs a minimal import/RUN/SUBMIT/progress smoke, and drops only that schema during cleanup. It reads `TEST_DATABASE_URL` first and falls back to `DATABASE_URL`, including from ignored `.env.local`, without printing credentials. Because the generated migrations contain foreign keys qualified as `"public".*`, the isolated validation rebinds those FK references to the disposable schema at runtime; it does not modify migration files or production tables.

`pnpm db:migrate` runs `drizzle-kit migrate` against the configured `DATABASE_URL`.

## Step 3 — Google OAuth

User action required:

1. Create Google OAuth credentials.
2. Add authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://<production-domain>/api/auth/callback/google
```

3. Store credentials in Vercel:

```text
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
```

Do not commit OAuth credentials.

The application uses a custom sign-in page at `/auth/signin`. Google OAuth is configured with `prompt=select_account` so the user can choose the Google account instead of silently reusing the active browser account.

## Step 4 — Auth.js secret and owner mapping

User action required:

1. Generate a cryptographically secure `AUTH_SECRET` with at least 32 characters.
2. Set Auth.js trusted-host handling for Vercel's reverse proxy:

```text
AUTH_TRUST_HOST=true
```

3. Store the allowed Google account e-mail list:

```text
Estudisc_ALLOWED_GOOGLE_EMAILS=owner@example.com
```

4. Store the owner mapping:

```text
Estudisc_OWNER_ID=production-owner
```

Only e-mails in `Estudisc_ALLOWED_GOOGLE_EMAILS` can access protected pages and APIs when Google OAuth is configured.

## Step 5 — Vercel project

User action required:

1. Import `theusinshow/estudisc` into Vercel.
2. Configure environment variables for Production and Preview as appropriate.
3. Confirm that Vercel's system environment variables are enabled.
4. Do not deploy until the local production-readiness gate passes.

Required Vercel variables:

```text
DATABASE_URL
APP_URL
AUTH_SECRET
AUTH_TRUST_HOST
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
Estudisc_ALLOWED_GOOGLE_EMAILS
Estudisc_OWNER_ID
LOG_LEVEL
```

## Step 6 — Production-readiness gate

Run locally before deployment:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run Playwright locally as smoke coverage, but remember it uses `DATABASE_URL=memory://local`:

```text
pnpm test:e2e
```

## Step 7 — Deployment validation

After the user explicitly authorizes deployment:

1. Deploy from Vercel.
2. Open `GET /api/health/db`.
3. Confirm unauthenticated protected pages redirect to `/auth/signin`.
4. Click `Continuar com Google` and confirm Google shows account selection.
5. Sign in with the allowed Google account.
6. Import the example Track Pack.
7. Run the JavaScript vertical slice.
8. Confirm export preview does not expose data to unauthenticated requests.

## OAuth troubleshooting

If Google shows `Erro 401: invalid_client` or `The OAuth client was not found`, treat it as a production environment/configuration issue before changing application code:

1. Confirm the production `AUTH_GOOGLE_ID` is the OAuth Client ID from the Google Cloud project that has this redirect URI:

```text
https://vecta-three.vercel.app/api/auth/callback/google
```

2. Confirm `AUTH_GOOGLE_SECRET` belongs to the same OAuth client.
3. Re-apply `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `APP_URL` and `AUTH_TRUST_HOST` in Vercel Production without printing values.
4. Redeploy production; existing deployments do not reliably pick up changed environment values.
5. Validate `/auth/signin`, click `Continuar com Google` and confirm Google no longer shows `invalid_client`.

## Stop conditions

Stop immediately if:

- any secret would need to be pasted into repository files;
- Google OAuth callback URL is not known;
- `DATABASE_URL` target is ambiguous;
- migrations fail against Neon;
- protected API routes are accessible without an allowed Google session;
- deployment would publish before the user confirms external writes.
