import { NextResponse } from "next/server";
import { getOwnerId, AccessDeniedError } from "@/features/auth/owner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { lessonResumeRepository } from "@/features/lessons/resume-api";
import { saveResumeSchema } from "@/features/lessons/resume-contracts";
import { ResumeConflictError, ResumeUnavailableError } from "@/features/lessons/resume-policy";
export async function POST(request: Request) {
  if (!getFeatureFlags().FEATURE_INTERACTIVE_LESSONS) return NextResponse.json({ code: "feature_disabled" }, { status: 404 });
  if (Number(request.headers.get("content-length") ?? 0) > 60000) return NextResponse.json({ code: "too_large" }, { status: 413 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 60000) return NextResponse.json({ code: "too_large" }, { status: 413 });
  let body: unknown; try { body = JSON.parse(raw); } catch { body = null; }
  const input = saveResumeSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  try { return NextResponse.json(await lessonResumeRepository().save(await getOwnerId(), input.data)); }
  catch (error) {
    if (error instanceof AccessDeniedError) return NextResponse.json({ code: "forbidden" }, { status: 403 });
    if (error instanceof ResumeUnavailableError) return NextResponse.json({ code: "resume_unavailable" }, { status: 404 });
    if (error instanceof ResumeConflictError) return NextResponse.json({ code: "resume_conflict" }, { status: 409 });
    throw error;
  }
}
