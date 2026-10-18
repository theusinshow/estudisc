import { NextResponse, type NextRequest } from "next/server";

import { AccessDeniedError, getOwnerProfile } from "@/features/auth/owner";
import { resolveContinueTarget } from "@/features/navigation/continue-target";
import { getRecommendationInputs } from "@/features/recommendations/api";
import { getStudyFlow } from "@/features/study-flow/api";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Central navigation button: resolved only when tapped, so ordinary page renders pay nothing. */
export async function GET(request: NextRequest) {
  // Behind the Railway proxy the request origin can be the internal host; APP_URL is the public one.
  const origin = getServerEnv().APP_URL ?? request.nextUrl.origin;
  try {
    const profile = await getOwnerProfile();
    const [flow, inputs] = await Promise.all([
      getStudyFlow(profile.ownerId),
      getRecommendationInputs(profile)
    ]);
    const target = resolveContinueTarget({ next: flow.next ?? null, dueReviewCount: inputs.dueReviews.length });
    return NextResponse.redirect(new URL(target, origin), 303);
  } catch (error) {
    if (error instanceof AccessDeniedError) return NextResponse.redirect(new URL("/auth/signin?callbackUrl=%2Fcontinuar", origin), 303);
    throw error;
  }
}
