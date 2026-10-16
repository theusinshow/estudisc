import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { PaymentFacts } from "./entitlement-policy";
import type { Product } from "./products";

const API = "https://api.mercadopago.com";

/**
 * Mercado Pago webhook signature (x-signature: "ts=<epoch>,v1=<hex>"). The signed manifest is
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, HMAC-SHA256 with the webhook secret.
 * Alphanumeric data ids are lowercased by the provider before signing.
 */
export function verifyWebhookSignature(input: { signature: string | null; requestId: string | null; dataId: string; secret: string; now?: Date; toleranceSeconds?: number }) {
  if (!input.signature || !input.secret) return false;
  const parts = Object.fromEntries(input.signature.split(",").map(part => part.trim().split("=", 2) as [string, string]));
  const ts = parts.ts, v1 = parts.v1;
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;
  const tsSeconds = Number(ts.length > 10 ? Number(ts) / 1000 : ts);
  const now = (input.now ?? new Date()).getTime() / 1000;
  if (!Number.isFinite(tsSeconds) || Math.abs(now - tsSeconds) > (input.toleranceSeconds ?? 600)) return false;
  const dataId = /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
  const manifest = `id:${dataId};${input.requestId ? `request-id:${input.requestId};` : ""}ts:${ts};`;
  const expected = createHmac("sha256", input.secret).update(manifest).digest();
  const received = Buffer.from(v1, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

const preferenceResponse = z.object({ id: z.string(), init_point: z.url() });
const paymentResponse = z.object({ id: z.union([z.number(), z.string()]), status: z.string(), transaction_amount: z.number(), currency_id: z.string(), external_reference: z.string().nullable().optional() });

export class MercadoPagoError extends Error { constructor(message: string) { super(message); this.name = "MercadoPagoError"; } }

/** Checkout Pro preference: card and Pix are handled on Mercado Pago's own page. */
export async function createPreference(input: { accessToken: string; product: Product; checkoutId: string; payerEmail?: string; appUrl: string; fetcher?: typeof fetch }) {
  const response = await (input.fetcher ?? fetch)(`${API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json", "X-Idempotency-Key": input.checkoutId },
    body: JSON.stringify({
      items: [{ id: input.product.id, title: input.product.title, description: input.product.description, quantity: 1, currency_id: input.product.currency, unit_price: input.product.priceCents / 100 }],
      external_reference: input.checkoutId,
      ...(input.payerEmail ? { payer: { email: input.payerEmail } } : {}),
      back_urls: { success: `${input.appUrl}/assinar/obrigado`, pending: `${input.appUrl}/assinar/obrigado`, failure: `${input.appUrl}/assinar?pagamento=falhou` },
      auto_return: "approved",
      notification_url: `${input.appUrl}/api/billing/webhook`,
      statement_descriptor: "ESTUDISC"
    })
  });
  if (!response.ok) throw new MercadoPagoError(`Preference request failed (${response.status})`);
  const parsed = preferenceResponse.parse(await response.json());
  return { preferenceId: parsed.id, checkoutUrl: parsed.init_point };
}

/** Always read the payment from the provider; webhook bodies are only a hint. */
export async function getPayment(input: { accessToken: string; paymentId: string; fetcher?: typeof fetch }): Promise<PaymentFacts> {
  if (!/^\d{1,30}$/.test(input.paymentId)) throw new MercadoPagoError("Invalid payment id");
  const response = await (input.fetcher ?? fetch)(`${API}/v1/payments/${input.paymentId}`, { headers: { Authorization: `Bearer ${input.accessToken}` } });
  if (!response.ok) throw new MercadoPagoError(`Payment request failed (${response.status})`);
  const payment = paymentResponse.parse(await response.json());
  return { id: String(payment.id), status: payment.status, amountCents: Math.round(payment.transaction_amount * 100), currency: payment.currency_id, externalReference: payment.external_reference ?? null };
}
