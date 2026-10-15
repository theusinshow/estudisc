# ADR 0061 — Paid access: R$ 50 one-time checkout via Mercado Pago

Status: Proposed (needs the owner's answers in "Open decisions" before implementation)
Date: 2026-10-15
Supersedes (when accepted): the "private allowlisted product" part of ADR 0026. Its roles and per-identity owners stay.

## Context

The owner wants to sell Estudisc as a product: **R$ 50, paid once, full access until the exam of the student's cohort** (first cohort: IFSC 2027/1, exam 29/11/2026), charged through **Mercado Pago** (Pix and card).

Today access is private: Google sign-in is allowed only for emails in `ESTUDISC_ALLOWED_GOOGLE_EMAILS`, plus code accounts created by hand (ADR 0031). Selling requires open sign-up and an access check that does not depend on an allowlist.

## Decision (proposed)

1. **Open sign-up, paid access.** Anyone can sign in with Google and gets a STUDENT owner. Without an active entitlement they only see a landing page, a sample lesson and the checkout. The existing allowlist and code accounts keep working and act as free entitlements (family, tests, admin).
2. **Entitlement table**, append-only, separate from content and learning state: `entitlements(id, owner_id, product_id, status, source, provider_payment_id, amount_cents, currency, starts_at, ends_at, created_at)`. `product_id = "ifsc-2027-1-full"`, `ends_at` = exam date + 1 day. Status changes are new rows (granted, refunded, revoked), never updates. Access = latest row is `granted` and `now < ends_at`.
3. **Checkout Pro (hosted by Mercado Pago).** The server creates a payment preference with `external_reference = <owner id>:<product id>:<nonce>` and redirects. Card and Pix data never touch Estudisc.
4. **Webhook is the only source of truth.** `POST /api/payments/mercadopago/webhook` checks the `x-signature` HMAC with the webhook secret, fetches the payment from the Mercado Pago API (never trusts the request body), and grants only when `status = approved`, the amount is 5000 cents BRL and the reference matches. Idempotent on the provider payment id. The return URL only shows "confirmando pagamento" and polls.
5. **Refunds and chargebacks** from the webhook append `refunded` or `revoked`. Brazilian consumer law gives 7 days to cancel an online purchase (CDC art. 49): refund on request inside that window.
6. **Secrets** (`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`) live only in Vercel env. The owner creates and stores them. Agents never handle real values.
7. Everything ships behind `FEATURE_PAID_ACCESS`, off by default, first with Mercado Pago test credentials.

## Open decisions (owner)

- **Minors and LGPD:** students are 14–15. The purchase must be made by a parent or guardian, and the privacy policy needs a guardian-consent clause (LGPD art. 14). Who signs the account: the student's Google or the parent's?
- **Content rights for sale:** lessons cite third-party sources and the IFSC edital. Before charging, confirm that the published lessons only quote within fair-use limits and that no reserved official question is exposed. The AI-assisted review of 2026-10-15 checks quality, not rights.
- **Seller identity and invoices:** CPF or MEI/CNPJ, and whether to issue NFS-e.
- **Terms of use, privacy policy and refund policy** pages, written or reviewed by the owner.
- **Capacity:** the current Aiven Free database (ADR 0059) has 20 connections and no SLA. Decide the limit of paying students before upgrading.

## Consequences

- Access control becomes a security boundary: every page and API route that serves lessons, questions or study state must check the entitlement, with tests.
- Paying users who are not family members raise the bar for content errors (see the lesson review) and for support.

## Implementation plan (after acceptance)

1. Schema + migration + repository for entitlements, with tests (append-only, latest-row access rule, expiry).
2. Access guard in the existing auth/owner layer and the route protections, with tests for each protected surface.
3. Checkout preference endpoint and webhook with signature check, idempotency and amount/reference checks, tested against recorded Mercado Pago test payloads.
4. Landing, paywall and "pagamento em confirmação" screens (mobile-first, Design System).
5. End-to-end run with Mercado Pago test users, then production credentials and the flag, only with the owner's confirmation.
