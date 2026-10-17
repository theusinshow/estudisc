# ADR 0068 — Persistent accounts, passwordless e-mail sign-in and self-service sign-up

Status: Accepted
Date: 2026-10-17
Extends: ADR 0031 (code accounts), ADR 0061 (paid access and Google sign-up). Roles and `ownerId` semantics are unchanged.

## Context

Identities live only in configuration: code accounts in `ESTUDISC_ACCOUNTS` (ADR 0031) and Google users as `google-${sha256(email)}` (ADR 0061). There is no account record, no e-mail sign-in and no way to sign up without a Google account. A SaaS needs self-service sign-up, a way back in without a password and an account the product can reason about (terms acceptance, guardian declaration, revocation). The two existing profiles (`account-matheus` ADMIN, `account-kaua` STUDENT) have real progress keyed by their `ownerId` and must keep it.

## Decision

1. **Account records keyed by the existing `ownerId`.** New tables, additive only:
   - `user_accounts(id → owners.id, email unique nullable, name, role, status, terms_version, terms_accepted_at, guardian_declaration jsonb, session_version, created_at, last_sign_in_at)`;
   - `account_identities(account_id, provider ∈ {email, google, legacy_code}, subject, unique(provider, subject))`;
   - `email_login_codes(email, code_hash, intent ∈ {signin, signup, link}, account_id, payload, attempts, expires_at, consumed_at)`.
   Learning state keeps pointing at `owners.id`, so no existing row is rewritten.
2. **Passwordless e-mail sign-in.** A 6-digit code is e-mailed (Resend, `RESEND_API_KEY`, sender `EMAIL_FROM`); it is stored only as an HMAC, expires in 10 minutes, allows 5 attempts and is single use. Starting a sign-in never reveals whether an e-mail has an account. No passwords are stored.
3. **Google stays an identity provider.** A Google e-mail that matches a linked identity lands on that account; otherwise the ADR 0061 id `google-${sha256(email)}` is kept, so existing Google progress is preserved.
4. **Sign-up** (`/auth/cadastro`, behind `FEATURE_OPEN_SIGNUP`): name, e-mail, acceptance of the current terms and, for students under 18, a declaration that a guardian authorized the use (owner decision; recorded with timestamp). New accounts get `id = user-<uuid>` and role `STUDENT`.
5. **Existing profiles.** A successful legacy code sign-in upserts the `user_accounts` row with the same id, name and role plus a `legacy_code` identity. From the profile screen the student links an e-mail (verified by code); afterwards e-mail or Google sign-in with that address lands on the same `ownerId`. Code sign-in keeps working.
6. **Sessions.** A signed cookie (`estudisc_user`, HMAC with `AUTH_SECRET`, 30 days) carries `{sub, role, sv}`. The proxy checks only the signature and expiry (no DB in the proxy); server-side owner resolution also checks that the account is active and `sv` matches `session_version`, so disabling an account or bumping the version revokes every session.

## Consequences

- Sign-up can ship dark: the code deploys with `FEATURE_OPEN_SIGNUP=false`, and existing sign-in keeps working.
- E-mail delivery is a new external dependency (Resend, via `fetch`, no SDK). Without `RESEND_API_KEY` production refuses to send; development and tests use an in-memory outbox.
- Rate limits for sending codes are per e-mail and per IP, in memory per instance (as ADR 0031), plus the per-code attempt cap stored in the database.
- The guardian declaration is weaker than verified parental consent; it is recorded so the product can move to verified consent later without losing history.

## Amendment — consolidation (2026-10-17)

- A parallel, smaller implementation (email-as-identity, Auth.js Credentials, Postgres rate limits) briefly landed on `main` under the same number and was reverted in favour of this ADR, because account records are needed for terms/guardian evidence, revocation and linking code profiles.
- The e-mail forms (sign-in, sign-up, link in `/conta`) render only when a sender can deliver: Resend in production (`isEmailDeliveryAvailable`), the in-memory outbox elsewhere. Deploying without `RESEND_API_KEY` therefore changes nothing for visitors.
- Known limit kept on purpose: the per-IP send cap is in memory. Production runs one Railway instance, so it behaves as a global cap; move it to Postgres before scaling out. The per-e-mail cap and per-code attempts are already in the database.
- A verified e-mail with no e-mail identity is first matched to the Google account for that address (linked `google` identity, or the ADR 0061 `google-${sha256(email)}` owner that already has learning state). The e-mail is linked to that account instead of creating a second one, which would otherwise also capture later Google sign-ins and hide the old progress.
