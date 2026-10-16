// @vitest-environment node
import { expect, it } from "vitest";
import { evaluateEntitlementAccess, PAID_ACCESS_ENDS_AT, paidAccessEndsAt, LIFETIME_PRODUCT_ID, type EntitlementRecord } from "@/features/payments/contracts";

it("paid access lasts until the end of the IFSC 2027/1 exam day in Brasília", () => {
  expect(PAID_ACCESS_ENDS_AT).toBe("2026-11-30T03:00:00.000Z");
  const row = { id: "e1", ownerId: "google-a", productId: LIFETIME_PRODUCT_ID, status: "granted", source: "mercadopago", providerPaymentId: "1", amountCents: 5000, currency: "BRL", endsAt: paidAccessEndsAt(), createdAt: new Date("2026-10-16T12:00:00Z") } as unknown as EntitlementRecord;
  expect(evaluateEntitlementAccess([row], new Date("2026-11-29T23:59:00-03:00")).active).toBe(true);
  expect(evaluateEntitlementAccess([row], new Date("2026-11-30T00:00:00-03:00")).active).toBe(false);
});
