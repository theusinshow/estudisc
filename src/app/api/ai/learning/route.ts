import { NextResponse } from "next/server";
import { getOwnerProfile } from "@/features/auth/owner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { aiRequestSchema } from "@/features/ai/contracts";
import { executeLearningAi } from "@/features/ai/server";
import { aiHttpError } from "@/features/ai/http-errors";
import { resolveAccessState } from "@/features/payments/access-guard";

export async function POST(request: Request) {
  if (!getFeatureFlags().FEATURE_AI_LEARNING) {
    return NextResponse.json({ code: "feature_disabled" }, { status: 404 });
  }
  try {
    const profile = await getOwnerProfile();
    const access = await resolveAccessState(profile);
    if (!access.hasFullAccess) {
      return NextResponse.json(
        { code: "paid_access_required", message: "O apoio de IA está incluído no acesso completo do Estudisc." },
        { status: 403 }
      );
    }
    const raw = await request.text();
    if (raw.length > 12_000) return NextResponse.json({ code: "body_too_large" }, { status: 413 });
    const input = aiRequestSchema.safeParse(JSON.parse(raw));
    if (!input.success) return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    return NextResponse.json(await executeLearningAi(profile.ownerId, input.data, request.signal));
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    return aiHttpError(error);
  }
}
