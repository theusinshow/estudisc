import { NextResponse } from "next/server";
import { AccessDeniedError, getOwnerProfile } from "@/features/auth/owner";
import { resolveAccessState } from "@/features/payments/access-guard";

export async function GET() {
  try {
    const profile = await getOwnerProfile();
    const state = await resolveAccessState(profile);
    return NextResponse.json(
      {
        hasFullAccess: state.hasFullAccess,
        source: state.source,
        sampleLessonIds: state.sampleLessonIds,
        entitlement: state.entitlement
          ? {
              id: state.entitlement.id,
              status: state.entitlement.status,
              source: state.entitlement.source,
              startsAt: state.entitlement.startsAt.toISOString(),
              endsAt: state.entitlement.endsAt ? state.entitlement.endsAt.toISOString() : null
            }
          : null
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ code: "access_denied" }, { status: 403 });
    }
    throw error;
  }
}
