# Railway deployment

The app runs on Railway as one Node service (`railway.json`: Railpack build, `pnpm build`, `pnpm start`, health check on the public `/conheca` page) plus a Railway Postgres service in the same project.

## Required variables (app service)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (private network reference) |
| `AUTH_SECRET` | Same value as before the move, so signed sessions keep working |
| `AUTH_TRUST_HOST` | `true` — Auth.js runs behind Railway's proxy; without it every request logs `UntrustedHost` |
| `APP_URL` | Public origin, e.g. `https://estudisc.com.br`; also accepted by the mutation-origin check |
| `ESTUDISC_ACCOUNTS` | Code profiles (formerly `KNOW_OS_ACCOUNTS` on Vercel) |
| `FEATURE_*` | Same flags as production |
| Paid access | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `MERCADOPAGO_*`, `ESTUDISC_SELLER_*`, `FEATURE_PAID_ACCESS` when sales open |

Next.js reads `PORT` from Railway automatically. The Google OAuth redirect URI is `<APP_URL>/api/auth/callback/google`; the Mercado Pago webhook is `<APP_URL>/api/payments/mercadopago/webhook`.

## Database move

1. `pg_dump -Fc` of the current database (kept in `.local/database-migration/private/`).
2. `pg_restore --no-owner --no-privileges` into Railway Postgres through its public proxy URL.
3. Compare row counts of every table between source and target before switching traffic.
4. Writes made on the old deployment after the dump are not copied: freeze writes (or accept the gap) during the switch.

## Domain

Add the domain in the service's Networking settings, create the DNS records Railway shows (CNAME, or A/ALIAS at the apex) at the registrar, then set `APP_URL` to the new origin and update Google OAuth and the Mercado Pago webhook.
