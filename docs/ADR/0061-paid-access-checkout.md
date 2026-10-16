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

## Amendment — access until the exam (2026-10-16)

The owner confirmed that a single payment of R$ 50 gives access **until the end of the IFSC 2027/1 exam day** (29/11/2026, Brasília), not lifetime access. Every grant (Mercado Pago payment, scholarship invite, admin grant) records `ends_at = PAID_ACCESS_ENDS_AT` (`2026-11-30T03:00:00Z`) unless a caller passes an explicit end. The product id is `ifsc-2027-1-full`. No entitlements existed yet, so no data migration is needed. A later cohort gets a new product and end date.

## Amendment — public pages and hybrid sign-in (2026-10-16)

- `/conheca` (sales), `/termos` and `/privacidade` are public (`PUBLIC_SITE_PATHS`). A visitor without a session who opens `/` is sent to `/conheca` instead of the sign-in form. While `FEATURE_PAID_ACCESS` is off, the sales page says enrolment opens soon and offers no purchase button.
- Seller identity on the legal pages comes from `ESTUDISC_SELLER_NAME`, `ESTUDISC_SELLER_DOCUMENT` and `ESTUDISC_SELLER_EMAIL`; until all three are set the pages say the data will be published before sales start.
- Hybrid sign-in: when code accounts (ADR 0031), Google OAuth and `FEATURE_PAID_ACCESS` are all configured, the proxy and `getOwnerProfile` accept a valid account cookie or a Google session. The sign-in page shows Google first; code profiles stay behind "Tenho um perfil com código", so profile names are not shown to visitors. Without all three, behaviour is unchanged.
- Published content counts for these pages and the paywall live in `src/features/public-site/content-summary.ts`.

- 2026-10-16: `/suporte` and `/pais-e-escolas` joined `PUBLIC_SITE_PATHS`; `robots.txt`, `sitemap.xml` and `/opengraph-image*` are public so crawlers and link previews work without a session.

- 2026-10-16: free sample lessons changed to the most interactive published lesson per subject (read-only production audit of interactive blocks and activities): `MAT-07` Porcentagem (numeric explorer + guided steps), `CIE-01` Movimento (prediction), `POR-03` Inferência (prediction), `GH-51` Fusos horários (worked calculations; no Geography/History lesson has interactive blocks yet).
