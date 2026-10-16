# Paid access launch checklist (ADR 0061)

The code ships with `FEATURE_PAID_ACCESS` off. With the flag off, nothing changes for current users: `/assinar`, `/termos` and `/privacidade` answer 404, and the webhook answers 404.

## Owner actions (cannot be done by an agent)

1. **Google sign-in.** In Google Cloud Console, create an OAuth client (type: Web application) with:
   - authorized redirect URI: `https://vecta-three.vercel.app/api/auth/callback/google`;
   - authorized origin: `https://vecta-three.vercel.app`.

   Then add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` to Vercel Production.
2. **Mercado Pago.** In your Mercado Pago account, open Suas integrações → Criar aplicação (Checkout Pro), then:
   - copy the production **Access Token** to `MERCADOPAGO_ACCESS_TOKEN`;
   - under Webhooks, set the URL `https://vecta-three.vercel.app/api/billing/webhook`, select the event **Pagamentos** and copy the **assinatura secreta** to `MERCADOPAGO_WEBHOOK_SECRET`.

   Test first with the test credentials and test buyers that Mercado Pago provides.
3. **`APP_URL`**: set it to `https://vecta-three.vercel.app` (or your own domain) in Vercel Production.
4. **Legal texts:** fill in the bracketed seller fields (name or company name, CPF or CNPJ, contact e-mail) in `src/app/termos/page.tsx` and `src/app/privacidade/page.tsx`, and review the texts. Decide whether you will issue invoices (NFS-e).
5. **Content rights:** confirm that the published lessons can be sold, meaning they only quote public sources and authored texts.
6. **Capacity:** the database is on the Aiven Free plan (20 connections, no SLA). Plan an upgrade once you have dozens of simultaneous paying students.

## Agent steps (already done or automatic)

- Database migration `0021` creates `billing_checkouts` and `entitlements` (additive only).
- Turning the flag on: `FEATURE_PAID_ACCESS=true` in Vercel Production plus a redeploy, after steps 1–4.

## Smoke test after turning it on

1. Open `/assinar` in a private window; it shows the price and "Entrar com Google para assinar".
2. Sign in with a non-family Google account. Opening `/` redirects to `/assinar`.
3. Pay with a Mercado Pago **test buyer**. `/assinar/obrigado` turns into "Acesso liberado" and `/` opens.
4. Refund the test payment in Mercado Pago. Access ends within 10 minutes (when the access cookie expires).
5. Kauã's code account and the admin account keep working without paying.
