import { beforeEach, expect, it, vi } from "vitest";

import { MercadoPagoError } from "@/features/payments/mercadopago";

const mocks = vi.hoisted(() => ({ process: vi.fn() }));
vi.mock("@/features/payments/mercadopago", async (original) => ({ ...(await original<object>()), processMercadoPagoWebhook: mocks.process }));
const { POST } = await import("@/app/api/payments/mercadopago/webhook/route");
const { NextRequest } = await import("next/server");

const notify = (body: unknown, query = "") =>
  POST(new NextRequest(`http://localhost/api/payments/mercadopago/webhook${query}`, { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

it("acknowledges non-payment topics without looking up a payment", async () => {
  const response = await notify({ type: "merchant_order", data: { id: "5" } });
  expect(response.status).toBe(200);
  expect(await notify({}, "?topic=merchant_order&id=5")).toHaveProperty("status", 200);
  expect(mocks.process).not.toHaveBeenCalled();
});

it("acknowledges payments that can never match so Mercado Pago stops retrying, but keeps signature and upstream errors retryable", async () => {
  for (const code of ["amount_mismatch", "invalid_reference"] as const) {
    mocks.process.mockRejectedValueOnce(new MercadoPagoError(code, code));
    const response = await notify({ type: "payment", data: { id: "9" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ action: "ignored", reasonCode: code });
  }
  mocks.process.mockRejectedValueOnce(new MercadoPagoError("invalid_signature", "x"));
  expect((await notify({ type: "payment", data: { id: "9" } })).status).toBe(401);
  mocks.process.mockRejectedValueOnce(new MercadoPagoError("upstream_error", "x"));
  expect((await notify({ type: "payment", data: { id: "9" } })).status).toBe(502);
});
