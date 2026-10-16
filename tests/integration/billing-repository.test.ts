import { afterEach, expect, it } from "vitest";
import { entitlements } from "@/db/schema";
import { BillingRepository } from "@/db/repositories/billing-repository";
import { findProduct } from "@/features/billing/products";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

let fixtureDb: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>> | undefined;
afterEach(async () => { await fixtureDb?.close(); fixtureDb = undefined; });

it("grants access once per approved payment, revokes on refund and ignores forged references", async () => {
  fixtureDb = await createMigratedPgliteTestDatabase();
  const repo = new BillingRepository(fixtureDb.db as never), product = findProduct("ifsc-2027-1-full")!;
  const now = new Date("2026-10-16T12:00:00Z");
  const checkout = await repo.createCheckout("google-customer-1", product);
  expect(await repo.hasAccess("google-customer-1", product.id, now)).toBe(false);

  const approved = { id: "1001", status: "approved", amountCents: 5000, currency: "BRL", externalReference: checkout.id };
  expect(await repo.applyPayment(approved, product, now)).toMatchObject({ changed: true, status: "granted", ownerId: "google-customer-1" });
  expect(await repo.applyPayment(approved, product, now)).toMatchObject({ changed: false });
  expect(await repo.hasAccess("google-customer-1", product.id, now)).toBe(true);
  expect(await repo.hasAccess("google-customer-1", product.id, new Date("2026-12-01T00:00:00Z"))).toBe(false);

  expect(await repo.applyPayment({ ...approved, externalReference: "not-a-uuid" }, product, now)).toMatchObject({ changed: false, reason: "unknown_reference" });
  expect(await repo.applyPayment({ ...approved, externalReference: "6f2f2b8e-7a51-4b54-9d0a-6e1b2c3d4e5f" }, product, now)).toMatchObject({ changed: false, reason: "unknown_checkout" });
  expect(await repo.applyPayment({ ...approved, id: "1002", amountCents: 1 }, product, now)).toMatchObject({ changed: false });

  expect(await repo.applyPayment({ ...approved, status: "refunded" }, product, new Date("2026-10-17T12:00:00Z"))).toMatchObject({ changed: true, status: "refunded" });
  expect(await repo.hasAccess("google-customer-1", product.id, new Date("2026-10-18T00:00:00Z"))).toBe(false);
  expect(await fixtureDb.db.select().from(entitlements)).toHaveLength(2);
});
