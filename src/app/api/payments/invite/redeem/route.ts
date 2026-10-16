import { NextResponse, type NextRequest } from "next/server";
import { getEntitlementRepository, InviteCodeError } from "@/db/repositories/entitlement-repository";
import { AccessDeniedError, getOwnerProfile } from "@/features/auth/owner";
import { redeemInviteCodeSchema } from "@/features/payments/contracts";

export async function POST(request: NextRequest) {
  try {
    const profile = await getOwnerProfile();
    const raw = await request.json().catch(() => null);
    const parsed = redeemInviteCodeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "invalid_input", message: "Informe um código de convite ou bolsa válido." },
        { status: 400 }
      );
    }

    const record = await getEntitlementRepository().redeemInviteCode(
      profile.ownerId,
      parsed.data.code,
      new Date(),
      profile.name ?? profile.email ?? profile.ownerId
    );

    return NextResponse.json(
      {
        ok: true,
        entitlement: {
          id: record.id,
          productId: record.productId,
          status: record.status,
          source: record.source,
          startsAt: record.startsAt.toISOString(),
          endsAt: record.endsAt ? record.endsAt.toISOString() : null
        }
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ code: "access_denied", message: "Entre com sua conta para continuar." }, { status: 403 });
    }
    if (error instanceof InviteCodeError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 400 });
    }
    throw error;
  }
}
