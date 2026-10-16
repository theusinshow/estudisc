import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getEntitlementRepository, InviteCodeError } from "@/db/repositories/entitlement-repository";
import { AccessDeniedError, requireAdmin } from "@/features/auth/owner";
import {
  adminGrantEntitlementSchema,
  createInviteCodeSchema,
  LIFETIME_CURRENCY,
  LIFETIME_PRODUCT_ID
} from "@/features/payments/contracts";

const adminMutationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create_invite"),
    ...createInviteCodeSchema.shape
  }),
  z.object({
    kind: z.literal("grant_or_revoke"),
    ...adminGrantEntitlementSchema.shape
  })
]);

export async function GET() {
  try {
    await requireAdmin();
    const repo = getEntitlementRepository();
    const [users, inviteCodes] = await Promise.all([
      repo.listAdminUsersOverview(),
      repo.listInviteCodes()
    ]);
    return NextResponse.json(
      { users, inviteCodes },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ code: "admin_required" }, { status: 403 });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const raw = await request.json().catch(() => null);
    const parsed = adminMutationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "invalid_input", message: "Dados inválidos para operação administrativa." },
        { status: 400 }
      );
    }

    const repo = getEntitlementRepository();

    if (parsed.data.kind === "create_invite") {
      const invite = await repo.createInviteCode({
        code: parsed.data.code,
        label: parsed.data.label,
        productId: LIFETIME_PRODUCT_ID,
        maxUses: parsed.data.maxUses,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        createdBy: admin.ownerId
      });
      return NextResponse.json({ ok: true, invite }, { status: 201 });
    }

    const { record } = await repo.appendEntitlement({
      ownerId: parsed.data.ownerId,
      displayName: parsed.data.displayName,
      productId: LIFETIME_PRODUCT_ID,
      status: parsed.data.action === "grant" ? "granted" : "revoked",
      source: "admin_grant",
      amountCents: 0,
      currency: LIFETIME_CURRENCY,
      endsAt: null,
      metadata: {
        adminOwnerId: admin.ownerId,
        reason: parsed.data.reason
      }
    });

    return NextResponse.json({ ok: true, entitlement: record }, { status: 200 });
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ code: "admin_required" }, { status: 403 });
    }
    if (error instanceof InviteCodeError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 400 });
    }
    throw error;
  }
}
