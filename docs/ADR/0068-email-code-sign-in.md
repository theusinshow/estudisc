# ADR 0068 — Email one-time code sign-in alongside Google

Status: Accepted (owner, 2026-10-17)
Date: 2026-10-17
Refines: ADR 0061 (open sign-up when `FEATURE_PAID_ACCESS=true`), ADR 0031 (code accounts), ADR 0013 (authenticated session).

## Context

ADR 0061 opened sign-up to any Google account. Students without (or unwilling to use) a Google account have no way in. The owner approved, on 2026-10-17, Google as the primary method plus a 6-digit code sent by email as the alternative, with passkeys deferred. Class/invite codes as a sign-in method were explicitly rejected (scholarship `invite_codes` from ADR 0061 stay as an entitlement mechanism only). Email/password and SMS/WhatsApp are out of scope.

## Decision

1. **Identity is the verified email.** A user who signs in with an email code receives the same `ownerId = google-${sha256(normalizedEmail)}` as the Google flow (the prefix is legacy and kept for compatibility). Google and email-code sign-ins for the same address therefore share learning state, entitlements and role with no account-linking table. Role stays `ADMIN` only for `ESTUDISC_ADMIN_GOOGLE_EMAILS`.
2. **Code issuance.** A server action (`requestEmailCodeAction`; Next checks the action origin) accepts an email, generates a 6-digit code with `crypto.randomInt`, stores only an HMAC-SHA256 of it (keyed by `AUTH_SECRET`) in `email_login_codes(id, email_hash, code_hash, expires_at, attempts, consumed_at, created_at)` with a 10-minute expiry, and sends it through the configured email provider. The response is identical whether or not the address has an existing owner (no enumeration).
3. **Code verification.** The Auth.js `email-code` Credentials provider (called by `verifyEmailCodeAction`) compares in constant time against the latest unconsumed, unexpired row; at most 5 attempts per code, then the code is dead. Success marks `consumed_at` and creates the session.
4. **Session.** Reuse the existing Auth.js JWT session via a Credentials-style provider that only accepts a server-verified, consumed code, so `auth()`, the proxy and `getOwnerProfile` keep one session path. No database session table.
5. **Rate limits in Postgres**, not memory: per email hash (max 3 codes / 10 min, 10 / day) and per IP (max 20 codes / hour), recorded in `auth_rate_events(key, kind, created_at)` and pruned by age. The in-memory throttle of ADR 0031 remains for code accounts.
6. **Email provider.** Resend over HTTPS behind a small `EmailSender` port; `RESEND_API_KEY` and `ESTUDISC_EMAIL_FROM` are server-only env vars. Without them the email option is hidden in the UI and the action answers that email sign-in is unavailable. In non-production without Resend, codes go to an in-memory outbox and the terminal. Unit tests use an in-memory sender; the existing Playwright harness keeps auth off, so the full flow was verified in a dev browser run.
7. **Feature flag.** `FEATURE_EMAIL_CODE_SIGNIN` (default `false`). Access rules are unchanged: the same `isAllowedGoogleEmail` gate applies to email-code identities (allowlist when paid access is off, open when on).
8. **LGPD.** The sign-in screen links `/termos` and `/privacidade`; emails are stored only as hashes in auth tables. Account data export/deletion and age/guardian handling for minors (LGPD art. 14, Lei 15.211/2025) are tracked as a separate increment, not part of this ADR.

## Consequences

- One person = one email = one `ownerId`, regardless of method. Changing email means a new identity (acceptable now; revisit if requested).
- Email deliverability (spam folders, school domains) becomes an operational dependency for the alternative method; Google stays the default.
- New migration with two append-mostly auth tables; no change to content, learning-state or entitlement schemas.

## Rejected alternatives

- **Magic link:** on phones it often opens in the mail app's in-app browser, losing the session.
- **Email + password:** reset flows, credential-stuffing risk and support burden.
- **SMS/WhatsApp OTP:** per-message cost and SIM-swap risk for a social project.
- **Auth.js database adapter with User/Account/Session tables:** heavier migration of existing owners for no gain while identity is the email.
- **Class/invite codes as sign-in:** rejected by the owner.
- **Passkeys now:** Auth.js WebAuthn support is still experimental; deferred.
