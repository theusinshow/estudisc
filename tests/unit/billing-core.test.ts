// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { entitlementForPayment, hasActiveEntitlement } from "@/features/billing/entitlement-policy";
import { createPreference, getPayment, verifyWebhookSignature } from "@/features/billing/mercadopago";
import { findProduct } from "@/features/billing/products";

const product = findProduct("ifsc-2027-1-full")!;
const checkout = { id: "6f2f2b8e-7a51-4b54-9d0a-6e1b2c3d4e5f", productId: product.id, amountCents: 5000, currency: "BRL" };
const day = (iso: string) => new Date(iso);

describe("entitlement policy", () => {
  const row = (status: string, createdAt: string) => ({ productId: product.id, status, startsAt: day("2026-10-16T00:00:00Z"), endsAt: day(product.accessEndsAt), createdAt: day(createdAt) });

  it("grants access between start and the end of the exam day, decided by the latest row", () => {
    expect(hasActiveEntitlement([row("granted", "2026-10-16T10:00:00Z")], product.id, day("2026-11-29T20:00:00Z"))).toBe(true);
    expect(hasActiveEntitlement([row("granted", "2026-10-16T10:00:00Z")], product.id, day("2026-11-30T03:00:00Z"))).toBe(false);
    expect(hasActiveEntitlement([row("granted", "2026-10-16T10:00:00Z"), row("refunded", "2026-10-18T10:00:00Z")], product.id, day("2026-10-20T00:00:00Z"))).toBe(false);
    expect(hasActiveEntitlement([], product.id)).toBe(false);
  });

  it("grants only an approved payment of the exact price for the checkout it references", () => {
    const paid = { id: "123", status: "approved", amountCents: 5000, currency: "BRL", externalReference: checkout.id };
    expect(entitlementForPayment(paid, checkout, product)).toBe("granted");
    expect(entitlementForPayment({ ...paid, amountCents: 100 }, checkout, product)).toBeNull();
    expect(entitlementForPayment({ ...paid, currency: "USD" }, checkout, product)).toBeNull();
    expect(entitlementForPayment({ ...paid, externalReference: "other" }, checkout, product)).toBeNull();
    expect(entitlementForPayment({ ...paid, status: "pending" }, checkout, product)).toBeNull();
    expect(entitlementForPayment({ ...paid, status: "refunded" }, checkout, product)).toBe("refunded");
    expect(entitlementForPayment({ ...paid, status: "charged_back" }, checkout, product)).toBe("revoked");
  });
});

describe("Mercado Pago adapter", () => {
  const secret = "test-webhook-secret";
  const sign = (dataId: string, requestId: string, ts: string) => createHmac("sha256", secret).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest("hex");

  it("accepts a valid recent signature and rejects tampering, staleness and missing secrets", () => {
    const now = day("2026-10-16T12:00:00Z"), ts = String(Math.floor(now.getTime() / 1000));
    const signature = `ts=${ts},v1=${sign("123456", "req-1", ts)}`;
    expect(verifyWebhookSignature({ signature, requestId: "req-1", dataId: "123456", secret, now })).toBe(true);
    expect(verifyWebhookSignature({ signature, requestId: "req-1", dataId: "999999", secret, now })).toBe(false);
    expect(verifyWebhookSignature({ signature, requestId: "req-2", dataId: "123456", secret, now })).toBe(false);
    expect(verifyWebhookSignature({ signature, requestId: "req-1", dataId: "123456", secret, now: day("2026-10-16T13:00:00Z") })).toBe(false);
    expect(verifyWebhookSignature({ signature, requestId: "req-1", dataId: "123456", secret: "", now })).toBe(false);
    expect(verifyWebhookSignature({ signature: null, requestId: "req-1", dataId: "123456", secret, now })).toBe(false);
  });

  it("creates a hosted preference bound to the checkout and reads payments from the API", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).endsWith("/checkout/preferences")) {
        const body = JSON.parse(String(init?.body));
        expect(body.external_reference).toBe(checkout.id);
        expect(body.items[0]).toMatchObject({ unit_price: 50, currency_id: "BRL", quantity: 1 });
        expect(body.notification_url).toBe("https://estudisc.example/api/billing/webhook");
        return new Response(JSON.stringify({ id: "pref-1", init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1" }));
      }
      return new Response(JSON.stringify({ id: 123, status: "approved", transaction_amount: 50, currency_id: "BRL", external_reference: checkout.id }));
    });
    const preference = await createPreference({ accessToken: "TEST", product, checkoutId: checkout.id, appUrl: "https://estudisc.example", fetcher: fetcher as typeof fetch });
    expect(preference.preferenceId).toBe("pref-1");
    expect(await getPayment({ accessToken: "TEST", paymentId: "123", fetcher: fetcher as typeof fetch })).toEqual({ id: "123", status: "approved", amountCents: 5000, currency: "BRL", externalReference: checkout.id });
    await expect(getPayment({ accessToken: "TEST", paymentId: "../x", fetcher: fetcher as typeof fetch })).rejects.toThrow(/Invalid payment id/);
  });
});
