import { beforeEach, describe, expect, it } from "vitest";
import { MemoryEntitlementRepository } from "@/db/repositories/entitlement-repository";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { isAllowedGoogleEmail, isLegacyAllowlistedGoogleEmail } from "@/features/auth/auth-readiness";
import { profileForEmail } from "@/features/auth/owner";
import { isPublicRuntimePath } from "@/features/auth/session-guard";
import { canAccessLesson, resolveAccessState } from "@/features/payments/access-guard";
import {
  evaluateEntitlementAccess,
  FREE_SAMPLE_LESSON_IDS,
  isFreeSampleLessonId,
  LIFETIME_PRODUCT_ID, PAID_ACCESS_ENDS_AT } from "@/features/payments/contracts";
import {
  buildExternalReference,
  computeMercadoPagoSignatureManifest,
  createMercadoPagoCheckoutPreference,
  MercadoPagoError,
  processMercadoPagoWebhook,
  signMercadoPagoManifest,
  verifyMercadoPagoSignature
} from "@/features/payments/mercadopago";
import { getServerEnv } from "@/lib/env";

describe("SaaS paid access, Mercado Pago webhook, and interactive free preview (ADR 0061)", () => {
  beforeEach(() => {
    const store = getMemoryStore();
    store.entitlements = [];
    store.inviteCodes = [];
  });

  it("keeps Google sign-in allowlisted when FEATURE_PAID_ACCESS is false and opens it when true", () => {
    const privateEnv = getServerEnv({
      ESTUDISC_ALLOWED_GOOGLE_EMAILS: "kaua@example.com,matheus@example.com",
      ESTUDISC_ADMIN_GOOGLE_EMAILS: "matheus@example.com",
      FEATURE_PAID_ACCESS: "false"
    });
    expect(isAllowedGoogleEmail("kaua@example.com", privateEnv)).toBe(true);
    expect(isAllowedGoogleEmail("novo.aluno@gmail.com", privateEnv)).toBe(false);

    const saasEnv = getServerEnv({
      ESTUDISC_ALLOWED_GOOGLE_EMAILS: "kaua@example.com,matheus@example.com",
      ESTUDISC_ADMIN_GOOGLE_EMAILS: "matheus@example.com",
      FEATURE_PAID_ACCESS: "true"
    });
    expect(isAllowedGoogleEmail("novo.aluno@gmail.com", saasEnv)).toBe(true);
    expect(isLegacyAllowlistedGoogleEmail("kaua@example.com", saasEnv)).toBe(true);
    expect(isLegacyAllowlistedGoogleEmail("novo.aluno@gmail.com", saasEnv)).toBe(false);

    const newStudent = profileForEmail("novo.aluno@gmail.com", saasEnv);
    expect(newStudent.role).toBe("STUDENT");
    expect(newStudent.allowlisted).toBe(false);
    expect(newStudent.ownerId).toMatch(/^google-[a-f0-9]{64}$/);

    const existingStudent = profileForEmail("kaua@example.com", saasEnv);
    expect(existingStudent.role).toBe("STUDENT");
    expect(existingStudent.allowlisted).toBe(true);
  });

  it("allows the 4 flagship interactive lessons in free preview and locks non-sample lessons until entitled", async () => {
    expect(FREE_SAMPLE_LESSON_IDS).toEqual(["MAT-07", "CIE-06", "POR-01", "GH-06"]);
    for (const sampleId of FREE_SAMPLE_LESSON_IDS) {
      expect(isFreeSampleLessonId(sampleId)).toBe(true);
    }
    expect(isFreeSampleLessonId("MAT-01")).toBe(false);
    expect(isFreeSampleLessonId("CIE-12")).toBe(false);

    const repo = new MemoryEntitlementRepository();
    const saasEnv = getServerEnv({
      ESTUDISC_ALLOWED_GOOGLE_EMAILS: "kaua@example.com",
      ESTUDISC_ADMIN_GOOGLE_EMAILS: "matheus@example.com",
      FEATURE_PAID_ACCESS: "true"
    });

    const previewProfile = profileForEmail("estudante.ifsc@gmail.com", saasEnv);
    const previewAccess = await resolveAccessState(previewProfile, saasEnv, repo);
    expect(previewAccess.hasFullAccess).toBe(false);
    expect(previewAccess.source).toBe("free_preview");

    expect(canAccessLesson("MAT-07", previewAccess)).toBe(true);
    expect(canAccessLesson("CIE-06", previewAccess)).toBe(true);
    expect(canAccessLesson("POR-01", previewAccess)).toBe(true);
    expect(canAccessLesson("GH-06", previewAccess)).toBe(true);
    expect(canAccessLesson("MAT-01", previewAccess)).toBe(false);

    const allowlistedProfile = profileForEmail("kaua@example.com", saasEnv);
    const allowlistedAccess = await resolveAccessState(allowlistedProfile, saasEnv, repo);
    expect(allowlistedAccess.hasFullAccess).toBe(true);
    expect(allowlistedAccess.source).toBe("allowlist");
    expect(canAccessLesson("MAT-01", allowlistedAccess)).toBe(true);
  });

  it("enforces append-only latest-row entitlement evaluation and scholarship invite codes", async () => {
    const repo = new MemoryEntitlementRepository();
    const ownerId = "google-student-1";

    const invite = await repo.createInviteCode({
      code: "ifsc-bolsa-2027",
      label: "Bolsa Social IFSC 2027",
      maxUses: 1,
      createdBy: "admin-1"
    });
    expect(invite.code).toBe("IFSC-BOLSA-2027");

    const granted = await repo.redeemInviteCode(ownerId, "ifsc-bolsa-2027", new Date("2026-10-15T12:00:00Z"), "Maria");
    expect(granted.status).toBe("granted");
    expect(granted.source).toBe("invite_code");
    expect(granted.endsAt?.toISOString()).toBe(PAID_ACCESS_ENDS_AT);

    // Idempotent if same already-entitled owner redeems again
    const repeat = await repo.redeemInviteCode(ownerId, "IFSC-BOLSA-2027", new Date("2026-10-15T12:01:00Z"), "Maria");
    expect(repeat.id).toBe(granted.id);

    // Exhausted for a second distinct student
    await expect(
      repo.redeemInviteCode("google-student-2", "IFSC-BOLSA-2027", new Date("2026-10-15T12:02:00Z"))
    ).rejects.toMatchObject({ code: "exhausted_code" });

    // Append a revocation row and verify latest-row rule revokes access without deleting history
    await repo.appendEntitlement({
      ownerId,
      productId: LIFETIME_PRODUCT_ID,
      status: "revoked",
      source: "admin_grant",
      createdAt: new Date("2026-10-16T12:00:00Z")
    });

    const history = await repo.listByOwner(ownerId);
    expect(history).toHaveLength(2);
    const evaluated = evaluateEntitlementAccess(history, new Date("2026-10-16T12:05:00Z"));
    expect(evaluated.active).toBe(false);
    expect(evaluated.latest?.status).toBe("revoked");
  });

  it("verifies Mercado Pago HMAC signatures, grants R$ 50 lifetime access idempotently, and handles refunds", async () => {
    expect(isPublicRuntimePath("/api/payments/mercadopago/webhook")).toBe(true);

    const repo = new MemoryEntitlementRepository();
    const webhookSecret = "mp-webhook-secret-test-123456";
    const accessToken = "TEST-MP-ACCESS-TOKEN";
    const ownerId = "google-paying-student";
    const externalReference = buildExternalReference(ownerId, "nonce-abc");

    const dataId = "99887766";
    const xRequestId = "req-112233";
    const ts = "1760565600";
    const manifest = computeMercadoPagoSignatureManifest({ dataId, xRequestId, ts });
    const v1 = signMercadoPagoManifest(manifest, webhookSecret);
    const xSignature = `ts=${ts},v1=${v1}`;

    expect(
      verifyMercadoPagoSignature({
        xSignature,
        xRequestId,
        dataId,
        secret: webhookSecret
      })
    ).toBe(true);

    expect(
      verifyMercadoPagoSignature({
        xSignature: `ts=${ts},v1=${"0".repeat(64)}`,
        xRequestId,
        dataId,
        secret: webhookSecret
      })
    ).toBe(false);

    // 1. Approved R$ 50 payment grants lifetime entitlement
    const firstResult = await processMercadoPagoWebhook({
      dataId,
      xSignature,
      xRequestId,
      webhookSecret,
      accessToken,
      repo,
      now: new Date("2026-10-15T15:00:00Z"),
      fetchPayment: async () => ({
        id: dataId,
        status: "approved",
        transaction_amount: 50,
        currency_id: "BRL",
        external_reference: externalReference,
        payment_type_id: "bank_transfer"
      })
    });
    expect(firstResult.action).toBe("granted");
    if (firstResult.action === "granted") {
      expect(firstResult.created).toBe(true);
      expect(firstResult.record.amountCents).toBe(5000);
      expect(firstResult.record.endsAt?.toISOString()).toBe(PAID_ACCESS_ENDS_AT);
    }

    // 2. Replay of the exact same webhook is idempotent
    const replayResult = await processMercadoPagoWebhook({
      dataId,
      xSignature,
      xRequestId,
      webhookSecret,
      accessToken,
      repo,
      now: new Date("2026-10-15T15:00:05Z"),
      fetchPayment: async () => ({
        id: dataId,
        status: "approved",
        transaction_amount: 50,
        currency_id: "BRL",
        external_reference: externalReference,
        payment_type_id: "bank_transfer"
      })
    });
    expect(replayResult.action).toBe("granted");
    if (replayResult.action === "granted") {
      expect(replayResult.created).toBe(false);
    }
    expect((await repo.hasActiveEntitlement(ownerId)).active).toBe(true);

    // 3. Underpaid amount is rejected
    await expect(
      processMercadoPagoWebhook({
        dataId,
        xSignature,
        xRequestId,
        webhookSecret,
        accessToken,
        repo,
        fetchPayment: async () => ({
          id: "other-id",
          status: "approved",
          transaction_amount: 10,
          currency_id: "BRL",
          external_reference: externalReference
        })
      })
    ).rejects.toBeInstanceOf(MercadoPagoError);

    // 4. Refund appends a refunded row and deactivates access
    const refundResult = await processMercadoPagoWebhook({
      dataId,
      xSignature,
      xRequestId,
      webhookSecret,
      accessToken,
      repo,
      now: new Date("2026-10-17T10:00:00Z"),
      fetchPayment: async () => ({
        id: dataId,
        status: "refunded",
        transaction_amount: 50,
        currency_id: "BRL",
        external_reference: externalReference
      })
    });
    expect(refundResult.action).toBe("refunded");
    expect((await repo.hasActiveEntitlement(ownerId, new Date("2026-10-17T10:01:00Z"))).active).toBe(false);
  });

  it("creates a Checkout Pro preference when access token is configured and falls back to sandbox in dev", async () => {
    const sandbox = await createMercadoPagoCheckoutPreference({
      ownerId: "google-dev-user",
      appUrl: "http://localhost:3000",
      nonce: "testnonce"
    });
    expect(sandbox.sandboxMode).toBe(true);
    expect(sandbox.checkoutUrl).toContain("/upgrade?status=sandbox&ref=");

    const live = await createMercadoPagoCheckoutPreference({
      ownerId: "google-live-user",
      email: "aluno@ifsc.edu.br",
      name: "Aluno IFSC",
      appUrl: "https://vecta-three.vercel.app",
      accessToken: "APP_USR-123",
      nonce: "livenonce",
      fetchImpl: (async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        expect(body.items[0].unit_price).toBe(50);
        expect(body.items[0].currency_id).toBe("BRL");
        expect(body.external_reference).toBe("google-live-user:ifsc-2027-1-full:livenonce");
        return new Response(
          JSON.stringify({
            id: "pref-999",
            init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-999"
          }),
          { status: 200 }
        );
      }) as typeof fetch
    });
    expect(live.sandboxMode).toBe(false);
    expect(live.preferenceId).toBe("pref-999");
    expect(live.checkoutUrl).toContain("mercadopago.com.br");
  });
});
