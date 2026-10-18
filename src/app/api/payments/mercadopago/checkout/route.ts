import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getEntitlementRepository } from "@/db/repositories/entitlement-repository";
import { AccessDeniedError, getOwnerProfile } from "@/features/auth/owner";
import { resolveAccessState } from "@/features/payments/access-guard";
import { LIFETIME_CURRENCY, LIFETIME_PRICE_CENTS, paidAccessEndsAt } from "@/features/payments/contracts";
import {
  createMercadoPagoCheckoutPreference,
  MercadoPagoError,
  parseExternalReference
} from "@/features/payments/mercadopago";
import { getServerEnv } from "@/lib/env";
import { logFunnelEvent } from "@/lib/funnel-events";

const checkoutBodySchema = z
  .object({
    sandboxConfirm: z.boolean().optional(),
    externalReference: z.string().optional()
  })
  .optional();

export async function POST(request: NextRequest) {
  try {
    const profile = await getOwnerProfile();
    const env = getServerEnv();
    const access = await resolveAccessState(profile, env);

    if (access.hasFullAccess) {
      logFunnelEvent("checkout_started", { status: "already_entitled" });
      return NextResponse.json(
        { alreadyEntitled: true, checkoutUrl: "/", sandboxMode: false },
        { status: 200 }
      );
    }

    const rawBody = await request.json().catch(() => undefined);
    const body = checkoutBodySchema.safeParse(rawBody);

    if (
      body.success &&
      body.data?.sandboxConfirm &&
      body.data.externalReference &&
      process.env.NODE_ENV !== "production" &&
      !env.MERCADOPAGO_ACCESS_TOKEN
    ) {
      const ref = parseExternalReference(body.data.externalReference);
      if (!ref || ref.ownerId !== profile.ownerId) {
        return NextResponse.json({ code: "invalid_reference", message: "Referência de sandbox inválida." }, { status: 400 });
      }
      await getEntitlementRepository().appendEntitlement({
        ownerId: profile.ownerId,
        displayName: profile.name ?? profile.email ?? profile.ownerId,
        productId: ref.productId,
        status: "granted",
        source: "mercadopago",
        providerPaymentId: `sandbox-${ref.nonce}`,
        amountCents: LIFETIME_PRICE_CENTS,
        currency: LIFETIME_CURRENCY,
        endsAt: paidAccessEndsAt(),
        metadata: { sandbox: true, nonce: ref.nonce }
      });
      return NextResponse.json({ alreadyEntitled: true, checkoutUrl: "/", sandboxMode: true }, { status: 200 });
    }

    const appUrl = env.APP_URL ?? new URL(request.url).origin;
    const preference = await createMercadoPagoCheckoutPreference({
      ownerId: profile.ownerId,
      email: profile.email,
      name: profile.name,
      appUrl,
      accessToken: env.MERCADOPAGO_ACCESS_TOKEN
    });

    logFunnelEvent("checkout_started", { status: preference.sandboxMode ? "sandbox" : "created" });
    return NextResponse.json(
      {
        alreadyEntitled: false,
        preferenceId: preference.preferenceId,
        checkoutUrl: preference.checkoutUrl,
        externalReference: preference.externalReference,
        sandboxMode: preference.sandboxMode
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ code: "access_denied", message: "Entre com sua conta para continuar." }, { status: 403 });
    }
    if (error instanceof MercadoPagoError) {
      logFunnelEvent("checkout_failed", { reasonCode: error.code });
      const status = error.code === "not_configured" ? 503 : 502;
      return NextResponse.json({ code: error.code, message: error.message }, { status });
    }
    throw error;
  }
}
