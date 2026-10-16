import { NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/logger";
import { requireAdmin, AccessDeniedError } from "@/features/auth/owner";
import { StandaloneQuestionRepository } from "@/db/repositories/content-qa/standalone-question-repository";
import { ContentPublicationService } from "@/db/repositories/content-qa/publication-service";

// ADR 0065: import (draft + release) and Admin Direct publication of standalone assessment Questions.
const action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("import"), trackId: z.unknown(), questions: z.unknown() }).strict(),
  z.object({ action: z.literal("publish_direct"), questions: z.unknown(), reason: z.unknown() }).strict()
]);
export async function POST(request: Request) {
  try {
    const profile = await requireAdmin();
    const raw = await request.text();
    if (raw.length > 1_500_000) return NextResponse.json({ code: "body_too_large" }, { status: 413 });
    const input = action.parse(JSON.parse(raw));
    const result = input.action === "import"
      ? await new StandaloneQuestionRepository().importSet(profile, { trackId: input.trackId, questions: input.questions })
      : await new ContentPublicationService().publishStandaloneQuestionsDirect(profile, { questions: input.questions, reason: input.reason });
    logEvent("info", "publication_completed", { operation: `standalone_${input.action}` });
    return NextResponse.json(result);
  } catch (error) {
    logEvent("error", "publication_failure", { operation: "standalone_questions", errorType: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ code: error instanceof AccessDeniedError ? "admin_required" : "standalone_action_blocked", message: error instanceof Error ? error.message : "Invalid request" }, { status: error instanceof AccessDeniedError ? 403 : 409 });
  }
}
