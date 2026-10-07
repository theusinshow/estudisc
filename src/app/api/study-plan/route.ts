import { NextResponse } from "next/server";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getOwnerId, AccessDeniedError } from "@/features/auth/owner";
import { studyPlanRepository } from "@/features/study-sessions/routine-api";
import { RoutineConflictError, routineRequestSchema, routineValidationMessage } from "@/features/study-sessions/routine-contracts";

const messages = {
  stale_preview: "Seu plano ou seu estudo mudou. Recarregue a rotina e gere uma nova prévia.",
  expired_preview: "A prévia expirou. Gere uma nova antes de salvar.",
  invalid_subject: "Uma matéria está indisponível. Confira sua seleção.",
  preview_not_found: "Prévia não encontrada. Gere uma nova.",
  routine_budget_exceeded: "A sessão ultrapassa o tempo disponível na sua rotina de hoje."
};
function failure(error: unknown) {
  if (error instanceof AccessDeniedError) return NextResponse.json({ code: "forbidden" }, { status: 403 });
  if (error instanceof RoutineConflictError) return NextResponse.json({ code: error.code, message: messages[error.code] }, { status: error.code === "preview_not_found" ? 404 : error.code === "invalid_subject" ? 400 : 409 });
  return NextResponse.json({ code: "routine_unavailable", message: "Não foi possível carregar a rotina. Suas sessões salvas foram preservadas; tente novamente." }, { status: 503 });
}
export async function GET() {
  if (!getFeatureFlags().FEATURE_STUDY_PLANNER) return NextResponse.json({ code: "not_found" }, { status: 404 });
  try { return NextResponse.json(await studyPlanRepository().getState(await getOwnerId()), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  if (!getFeatureFlags().FEATURE_STUDY_PLANNER) return NextResponse.json({ code: "not_found" }, { status: 404 });
  try {
    const ownerId = await getOwnerId(), raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 32_768) return NextResponse.json({ code: "body_too_large" }, { status: 413 });
    const input = routineRequestSchema.safeParse(JSON.parse(raw));
    if (!input.success) return NextResponse.json({ code: "invalid_request", message: routineValidationMessage(input.error) }, { status: 400 });
    const repo = studyPlanRepository();
    return NextResponse.json(input.data.action === "preview"
      ? await repo.preview(ownerId, input.data.settings, input.data.baseRevision)
      : await repo.apply(ownerId, input.data.previewId), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { if (error instanceof SyntaxError) return NextResponse.json({ code: "invalid_request", message: "Confira os dados enviados." }, { status: 400 }); return failure(error); }
}
