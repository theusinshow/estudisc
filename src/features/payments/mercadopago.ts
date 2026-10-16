import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getEntitlementRepository, type EntitlementRepository } from "@/db/repositories/entitlement-repository";
import {
  LIFETIME_CURRENCY,
  paidAccessEndsAt,
  LIFETIME_PRICE_BRL,
  LIFETIME_PRICE_CENTS,
  LIFETIME_PRODUCT_ID,
  type EntitlementRecord
} from "./contracts";

export class MercadoPagoError extends Error {
  constructor(
    public readonly code:
      | "not_configured"
      | "invalid_signature"
      | "invalid_reference"
      | "amount_mismatch"
      | "upstream_error",
    message: string
  ) {
    super(message);
  }
}

export function buildExternalReference(ownerId: string, nonce: string = randomUUID()): string {
  return `${ownerId}:${LIFETIME_PRODUCT_ID}:${nonce}`;
}

export function parseExternalReference(
  externalReference: string | null | undefined
): { ownerId: string; productId: string; nonce: string } | null {
  if (!externalReference) return null;
  const parts = externalReference.split(":");
  if (parts.length !== 3) return null;
  const [ownerId, productId, nonce] = parts;
  if (!ownerId?.trim() || productId !== LIFETIME_PRODUCT_ID || !nonce?.trim()) {
    return null;
  }
  return { ownerId: ownerId.trim(), productId, nonce: nonce.trim() };
}

export function computeMercadoPagoSignatureManifest(params: {
  dataId: string;
  xRequestId: string;
  ts: string;
}): string {
  return `id:${params.dataId.toLowerCase()};request-id:${params.xRequestId};ts:${params.ts};`;
}

export function signMercadoPagoManifest(manifest: string, secret: string): string {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

export function verifyMercadoPagoSignature(params: {
  xSignature: string | null | undefined;
  xRequestId: string | null | undefined;
  dataId: string | null | undefined;
  secret: string | undefined;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!xSignature || !xRequestId || !dataId || !secret) {
    return false;
  }

  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of xSignature.split(",")) {
    const [key, value] = part.split("=").map((item) => item?.trim());
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }

  if (!ts || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) {
    return false;
  }

  const manifest = computeMercadoPagoSignatureManifest({ dataId, xRequestId, ts });
  const expectedHex = signMercadoPagoManifest(manifest, secret);
  const expectedBuf = Buffer.from(expectedHex, "hex");
  const actualBuf = Buffer.from(v1, "hex");
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, actualBuf);
}

const preferenceResponseSchema = z.object({
  id: z.string().min(1),
  init_point: z.url(),
  sandbox_init_point: z.url().optional()
});

export type CheckoutPreferenceResult = Readonly<{
  preferenceId: string;
  checkoutUrl: string;
  externalReference: string;
  sandboxMode: boolean;
}>;

export async function createMercadoPagoCheckoutPreference(params: {
  ownerId: string;
  email?: string;
  name?: string;
  appUrl: string;
  accessToken?: string;
  nonce?: string;
  fetchImpl?: typeof fetch;
}): Promise<CheckoutPreferenceResult> {
  const externalReference = buildExternalReference(params.ownerId, params.nonce);
  const baseUrl = params.appUrl.replace(/\/$/, "");

  if (!params.accessToken) {
    if (process.env.NODE_ENV === "production") {
      throw new MercadoPagoError("not_configured", "O checkout do Mercado Pago ainda não está configurado.");
    }
    const noncePart = externalReference.split(":")[2] ?? "local";
    return {
      preferenceId: `sandbox-${noncePart}`,
      checkoutUrl: `${baseUrl}/upgrade?status=sandbox&ref=${encodeURIComponent(externalReference)}`,
      externalReference,
      sandboxMode: true
    };
  }

  const fetchFn = params.fetchImpl ?? fetch;
  const response = await fetchFn("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: [
        {
          id: LIFETIME_PRODUCT_ID,
          title: "Estudisc — Acesso completo até a prova do IFSC 2027/1",
          description: "Acesso completo a todas as aulas, questões e revisões até o dia da prova (29/11/2026).",
          quantity: 1,
          currency_id: LIFETIME_CURRENCY,
          unit_price: LIFETIME_PRICE_BRL
        }
      ],
      payer: {
        ...(params.email ? { email: params.email } : {}),
        ...(params.name ? { name: params.name } : {})
      },
      external_reference: externalReference,
      back_urls: {
        success: `${baseUrl}/upgrade?status=confirming`,
        pending: `${baseUrl}/upgrade?status=confirming`,
        failure: `${baseUrl}/upgrade?status=failure`
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
      statement_descriptor: "ESTUDISC"
    })
  });

  if (!response.ok) {
    throw new MercadoPagoError("upstream_error", "Não foi possível iniciar o checkout no Mercado Pago.");
  }

  const parsed = preferenceResponseSchema.parse(await response.json());
  return {
    preferenceId: parsed.id,
    checkoutUrl: parsed.init_point,
    externalReference,
    sandboxMode: false
  };
}

export const mercadoPagoPaymentSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  status: z.string(),
  transaction_amount: z.number(),
  currency_id: z.string(),
  external_reference: z.string().nullable().optional(),
  payment_type_id: z.string().optional(),
  date_approved: z.string().nullable().optional()
});

export type MercadoPagoPaymentPayload = z.infer<typeof mercadoPagoPaymentSchema>;

export async function fetchMercadoPagoPaymentFromApi(
  paymentId: string,
  accessToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<MercadoPagoPaymentPayload> {
  const response = await fetchImpl(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      cache: "no-store"
    }
  );
  if (!response.ok) {
    throw new MercadoPagoError("upstream_error", `Falha ao consultar pagamento ${paymentId} no Mercado Pago.`);
  }
  return mercadoPagoPaymentSchema.parse(await response.json());
}

export type WebhookProcessResult =
  | Readonly<{
      action: "granted" | "refunded" | "revoked";
      created: boolean;
      record: EntitlementRecord;
    }>
  | Readonly<{
      action: "ignored";
      reason: string;
    }>;

export async function processMercadoPagoWebhook(params: {
  dataId: string;
  xSignature: string | null | undefined;
  xRequestId: string | null | undefined;
  webhookSecret: string | undefined;
  accessToken: string | undefined;
  repo?: EntitlementRepository;
  fetchPayment?: (paymentId: string, token: string) => Promise<MercadoPagoPaymentPayload>;
  now?: Date;
}): Promise<WebhookProcessResult> {
  if (!params.webhookSecret || !params.accessToken) {
    throw new MercadoPagoError("not_configured", "Credenciais do Mercado Pago ausentes.");
  }

  const validSignature = verifyMercadoPagoSignature({
    xSignature: params.xSignature,
    xRequestId: params.xRequestId,
    dataId: params.dataId,
    secret: params.webhookSecret
  });

  if (!validSignature) {
    throw new MercadoPagoError("invalid_signature", "Assinatura do webhook Mercado Pago inválida.");
  }

  const fetchPayment = params.fetchPayment ?? fetchMercadoPagoPaymentFromApi;
  const payment = await fetchPayment(params.dataId, params.accessToken);
  const reference = parseExternalReference(payment.external_reference);
  if (!reference) {
    throw new MercadoPagoError("invalid_reference", "Referência externa do pagamento inválida.");
  }

  const repo = params.repo ?? getEntitlementRepository();
  const amountCents = Math.round(payment.transaction_amount * 100);

  if (payment.status === "approved") {
    if (payment.currency_id !== LIFETIME_CURRENCY || amountCents < LIFETIME_PRICE_CENTS) {
      throw new MercadoPagoError(
        "amount_mismatch",
        `Valor ou moeda inválidos: esperado ${LIFETIME_PRICE_CENTS} ${LIFETIME_CURRENCY}, recebido ${amountCents} ${payment.currency_id}.`
      );
    }

    const { record, created } = await repo.appendEntitlement({
      ownerId: reference.ownerId,
      productId: reference.productId,
      status: "granted",
      source: "mercadopago",
      providerPaymentId: payment.id,
      amountCents,
      currency: payment.currency_id,
      startsAt: params.now ?? new Date(),
      endsAt: paidAccessEndsAt(),
      metadata: {
        nonce: reference.nonce,
        paymentTypeId: payment.payment_type_id ?? null,
        dateApproved: payment.date_approved ?? null
      },
      createdAt: params.now ?? new Date()
    });
    return { action: "granted", created, record };
  }

  if (payment.status === "refunded") {
    const { record, created } = await repo.appendEntitlement({
      ownerId: reference.ownerId,
      productId: reference.productId,
      status: "refunded",
      source: "mercadopago",
      providerPaymentId: payment.id,
      amountCents,
      currency: payment.currency_id,
      startsAt: params.now ?? new Date(),
      endsAt: paidAccessEndsAt(),
      metadata: { nonce: reference.nonce },
      createdAt: params.now ?? new Date()
    });
    return { action: "refunded", created, record };
  }

  if (payment.status === "charged_back") {
    const { record, created } = await repo.appendEntitlement({
      ownerId: reference.ownerId,
      productId: reference.productId,
      status: "revoked",
      source: "mercadopago",
      providerPaymentId: payment.id,
      amountCents,
      currency: payment.currency_id,
      startsAt: params.now ?? new Date(),
      endsAt: paidAccessEndsAt(),
      metadata: { nonce: reference.nonce, reason: "charged_back" },
      createdAt: params.now ?? new Date()
    });
    return { action: "revoked", created, record };
  }

  return { action: "ignored", reason: `status_${payment.status}` };
}
