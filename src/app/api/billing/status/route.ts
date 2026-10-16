import { NextResponse } from "next/server";
import { AccessDeniedError, getOwnerProfile } from "@/features/auth/owner";
import { BillingRepository } from "@/db/repositories/billing-repository";
import { isPaidAccessEnabled } from "@/features/billing/paid-access";
import { DEFAULT_PRODUCT_ID } from "@/features/billing/products";
import { getServerEnv } from "@/lib/env";

/** Lets the thank-you page wait for the webhook without trusting the redirect from the provider. */
export async function GET() {
  if (!isPaidAccessEnabled(getServerEnv())) return NextResponse.json({ active: true });
  try {
    const { ownerId } = await getOwnerProfile();
    return NextResponse.json({ active: await new BillingRepository().hasAccess(ownerId, DEFAULT_PRODUCT_ID) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AccessDeniedError) return NextResponse.json({ active: false, code: "auth_required" }, { status: 401 });
    throw error;
  }
}
