// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ applyPayment: vi.fn(), getPayment: vi.fn() }));
vi.mock("@/db/repositories/billing-repository", () => ({ BillingRepository: class { applyPayment = mocks.applyPayment; } }));
vi.mock("@/features/billing/mercadopago", async importOriginal => ({ ...(await importOriginal<typeof import("@/features/billing/mercadopago")>()), getPayment: mocks.getPayment }));

import { POST } from "@/app/api/billing/webhook/route";
import { signAccessCookie, verifyAccessCookie } from "@/features/billing/paid-access";

const secret = "whsec-test";
function signed(dataId: string, requestId = "req-1") {
  const ts = String(Math.floor(Date.now() / 1000));
  const v1 = createHmac("sha256", secret).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest("hex");
  return new Request(`https://estudisc.example/api/billing/webhook?type=payment&data.id=${dataId}`, { method: "POST", headers: { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId, "content-type": "application/json" }, body: JSON.stringify({ type: "payment", data: { id: dataId } }) });
}

describe("billing webhook route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs(); vi.clearAllMocks();
    for (const [key, value] of Object.entries({ FEATURE_PAID_ACCESS: "true", AUTH_SECRET: "x".repeat(40), AUTH_GOOGLE_ID: "google-id", AUTH_GOOGLE_SECRET: "google-secret", MERCADOPAGO_ACCESS_TOKEN: "TEST-token", MERCADOPAGO_WEBHOOK_SECRET: secret })) vi.stubEnv(key, value);
    mocks.getPayment.mockResolvedValue({ id: "777", status: "approved", amountCents: 5000, currency: "BRL", externalReference: "6f2f2b8e-7a51-4b54-9d0a-6e1b2c3d4e5f" });
    mocks.applyPayment.mockResolvedValue({ changed: true, status: "granted", ownerId: "google-x" });
  });

  it("applies the payment read from the provider when the signature is valid", async () => {
    const response = await POST(signed("777"));
    expect(response.status).toBe(200);
    expect(mocks.getPayment).toHaveBeenCalledWith(expect.objectContaining({ paymentId: "777", accessToken: "TEST-token" }));
    expect(mocks.applyPayment).toHaveBeenCalledWith(expect.objectContaining({ id: "777", status: "approved" }), expect.objectContaining({ id: "ifsc-2027-1-full" }));
  });

  it("rejects forged or tampered notifications without touching the provider or the database", async () => {
    const forged = signed("777"); forged.headers.set("x-signature", "ts=1,v1=" + "0".repeat(64));
    expect((await POST(forged)).status).toBe(401);
    const tampered = new Request(signed("777").url.replace("777", "778"), { method: "POST", headers: signed("777").headers });
    expect((await POST(tampered)).status).toBe(401);
    expect(mocks.getPayment).not.toHaveBeenCalled();
    expect(mocks.applyPayment).not.toHaveBeenCalled();
  });

  it("is invisible while paid access is off", async () => {
    vi.stubEnv("FEATURE_PAID_ACCESS", "false");
    expect((await POST(signed("777"))).status).toBe(404);
  });
});

describe("access cookie", () => {
  it("binds the owner and expires", () => {
    const now = Date.parse("2026-10-16T12:00:00Z");
    const cookie = signAccessCookie("google-a", "secret-1", now);
    expect(verifyAccessCookie(cookie, "google-a", "secret-1", now + 60_000)).toBe(true);
    expect(verifyAccessCookie(cookie, "google-b", "secret-1", now + 60_000)).toBe(false);
    expect(verifyAccessCookie(cookie, "google-a", "secret-2", now + 60_000)).toBe(false);
    expect(verifyAccessCookie(cookie, "google-a", "secret-1", now + 11 * 60_000)).toBe(false);
    expect(verifyAccessCookie(`${cookie}x`, "google-a", "secret-1", now)).toBe(false);
  });
});
