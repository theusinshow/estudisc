# ADR 0031: Dev-created code accounts

Status: Accepted (user request, 2026-10-01)

## Context

The owner wants a simple way to separate progress between family members (the owner as ADMIN, a brother as STUDENT) without Google accounts, using the React Bits "Code Slots" input. Accounts are created only by the developer. The user chose to use this login locally **and in production**.

## Decision

- `KNOW_OS_ACCOUNTS` (JSON list of `{id, name, role, code}`) enables accounts mode. `code` is a salted scrypt hash (`scrypt:N:r:p:salt:hash`; `:` because Next expands `$NAME` in `.env` files). Plain codes are never stored, printed or committed.
- `scripts/create-account.mjs` creates/updates/removes accounts in `.env.local` and generates `AUTH_SECRET` when missing. Production receives the same two variables through the host's environment settings.
- Sign-in: profile picker + 6-digit code → `POST /api/session` sets an httpOnly, SameSite=Lax HMAC-SHA256 session cookie (30 days) signed with `AUTH_SECRET`. The token carries a fingerprint of the account's code hash, so changing a code invalidates its sessions. `DELETE /api/session` signs out.
- When accounts mode is on it takes precedence over Google OAuth in `getOwnerProfile` and the proxy, in every environment. The account `id` is the owner id, so learning state stays owner-scoped (ADR 0026); admin paths require role ADMIN.
- Guessing is slowed by 5 failures per IP+account per 10 minutes, plus the existing mutation-origin check.
- The Code Slots component is vendored with attribution (MIT + Commons Clause) and adapted to the CSP (no inline style attributes; client-only render), design tokens and Portuguese labels.

## Consequences

- Google OAuth (ADR 0015) remains available when `KNOW_OS_ACCOUNTS` is empty.
- A 6-digit code is weak against a determined attacker. The throttle is in-memory per server instance, so on serverless hosting it is not a global limit. Acceptable for a private family app; not suitable for a public product.
- Playwright keeps accounts off (`KNOW_OS_ACCOUNTS=""`); the local demo seed mints an ADMIN session from `.env.local` to import content.

## Rejected alternatives

- Code-only login without a profile picker: same guessing space, less clear "who is studying".
- Storing accounts in the database: needs an admin UI and migrations for two fixed accounts.
