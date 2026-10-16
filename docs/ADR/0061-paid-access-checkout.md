# ADR 0061 — Paid access: R$ 50 lifetime checkout via Mercado Pago, interactive free preview, and scholarship invites

Status: Accepted
Date: 2026-10-15
Supersedes: the "private allowlisted product" constraint of ADR 0026 when `FEATURE_PAID_ACCESS=true`. Its roles (`ADMIN`, `STUDENT`) and per-identity `ownerId` mapping remain unchanged.

## Context

The owner approved evolving Estudisc into a popular-price social SaaS: **R$ 50,00 (`5000` cents BRL), paid once, for full lifetime access (`ends_at = null`)**, charged through **Mercado Pago** (Pix and card), while preserving a generous **Free Preview** (the initial Diagnostic assessment plus the 4 most interactive lessons, one per subject) and **Scholarship / Cohort Invite Codes** managed from an Admin panel.

## Decision

1. **Open Google OAuth sign-up with backward-compatible `ownerId`.**
   - When `FEATURE_PAID_ACCESS=true`, any valid Google account can sign in and receives `ownerId = google-${sha256(email)}` with role `STUDENT` (or `ADMIN` if listed in `ESTUDISC_ADMIN_GOOGLE_EMAILS`).
   - Existing allowlisted emails (`ESTUDISC_ALLOWED_GOOGLE_EMAILS`, `ESTUDISC_ADMIN_GOOGLE_EMAILS`) and code accounts (`ESTUDISC_ACCOUNTS`, ADR 0031) retain automatic free full access without paying and keep their exact `ownerId` and learning history.
2. **Append-only `entitlements` table and `invite_codes` table**, separate from content and learning state:
   - `entitlements(id, owner_id, product_id, status, source, provider_payment_id, amount_cents, currency, starts_at, ends_at, metadata, created_at)`
   - `product_id = "estudisc-lifetime-full"`, `ends_at = null` for lifetime access (or an explicit timestamp for time-bounded cohorts).
   - Status changes append a new row (`granted`, `refunded`, `revoked`), never mutating historical rows.
   - Active entitlement = latest row for `(owner_id, product_id)` has `status = "granted"` and `(ends_at IS NULL OR now < ends_at)`.
   - `invite_codes(id, code, label, product_id, max_uses, used_count, expires_at, active, created_by, created_at)` allows social scholarship/cohort redemption in one transaction.
3. **Interactive Free Preview (1 showcase lesson per subject + Diagnostic).**
   - Authenticated students without an active full entitlement can access the catalog, the Diagnostic assessment, and the 4 flagship interactive lessons:
     - **Matemática:** `MAT-07` (*Porcentagem: parte, desconto e preço final* — numeric explorer + guided steps)
     - **Ciências:** `CIE-06` (*Estrutura atômica: partículas, massa e íons* — interactive atom diagram + classification)
     - **Português:** `POR-01` (*Compreensão e inferência: o texto sustenta sua leitura?* — prediction + text highlight + classification)
     - **Geografia e História:** `GH-06` (*Escravidão, resistência e abolição como processo* — timeline + prediction + classification)
   - All other lessons, adaptive study sessions, and AI tutor requests require full access (`hasFullAccess = true`).
4. **Mercado Pago Checkout Pro (`POST /api/payments/mercadopago/checkout`).**
   - Server creates a Mercado Pago preference (`amount = 50.00 BRL`, Pix + card enabled) with `external_reference = ${ownerId}:estudisc-lifetime-full:${nonce}` and redirects the user to Mercado Pago's hosted checkout (or local sandbox confirmation in test mode). Card and Pix sensitive data never touch Estudisc.
5. **Webhook as single source of truth (`POST /api/payments/mercadopago/webhook`).**
   - Verifies the `x-signature` HMAC (`ts` + `v1` manifest over `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`) using `MERCADOPAGO_WEBHOOK_SECRET`.
   - Fetches the authoritative payment status from the Mercado Pago API (`GET /v1/payments/{id}`) using `MERCADOPAGO_ACCESS_TOKEN`.
   - Grants access (`status = "granted"`, `source = "mercadopago"`) only when `status === "approved"`, `transaction_amount >= 50`, `currency_id === "BRL"`, and `external_reference` matches `<ownerId>:estudisc-lifetime-full:<nonce>`.
   - Refunds/chargebacks (`status === "refunded"` or `"charged_back"`) append a `refunded` or `revoked` row.
   - Idempotent on `(provider_payment_id, status)`.
6. **AI Quota & Shared Semantic Cache Protection.**
   - Existing per-owner rate limits (`usage-policy.ts`: 6 provider calls/minute, 20 provider calls/day, 60-minute owner cache) remain enforced, and non-entitled preview users cannot invoke paid AI provider calls when `FEATURE_PAID_ACCESS=true`.
7. **Feature Flag & Secrets.**
   - Guarded by `FEATURE_PAID_ACCESS` (default `false`).
   - `MERCADOPAGO_ACCESS_TOKEN` and `MERCADOPAGO_WEBHOOK_SECRET` live only in server environment variables.
