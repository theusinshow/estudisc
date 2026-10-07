import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin, AccessDeniedError } from "@/features/auth/owner";
import { getDatabaseUrl, ensureDatabaseReady } from "@/db/connection";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { readJsonRequestWithLimit, MAX_TRACK_PACK_BYTES } from "@/features/import/api";
import { importLessonVersion } from "@/features/import/application/lesson-version-policy";
import { LessonVersionConflictError } from "@/features/import/application/lesson-version-contracts";
import { lessonVersionPackSchema } from "@/features/import/application/lesson-version-contracts";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { logEvent } from "@/lib/logger";
export async function handleLessonVersionRequest(request: Request, preview: boolean) {
  try {
    const actor = await requireAdmin();
    const parsed = await readJsonRequestWithLimit(request, MAX_TRACK_PACK_BYTES);
    if (!parsed.ok) return NextResponse.json({ code: parsed.code }, { status: parsed.code === "payload_too_large" ? 413 : 400 });
    await ensureDatabaseReady();
    const repo = getDatabaseUrl() === "memory://local" ? new MemoryTrackImportRepository() : new DrizzleTrackImportRepository(undefined, actor.ownerId);
    const packet = lessonVersionPackSchema.parse(parsed.body);
    const result = await importLessonVersion(packet, repo, preview);
    if (preview) return NextResponse.json({ ...result, operation: result.status === "already_imported" ? "no_change" : "import", contentHash: hashCanonicalJson(packet),
      summary: { trackStableId: packet.target.trackId, trackTitle: `${packet.lesson.title} · versão ${packet.lesson.version}`, moduleCount: 1, lessonCount: 1, activityCount: packet.lesson.activities.length, conceptCount: packet.lesson.concepts.length } });
    return NextResponse.json({ ...result, summary: { trackStableId: packet.target.trackId, importedLessons: 1, importedActivities: packet.lesson.activities.length } }, { status: result.status === "imported" ? 201 : 200 });
  } catch (error) {
    if (error instanceof AccessDeniedError) return NextResponse.json({ code: "admin_required" }, { status: 403 });
    if (error instanceof ZodError) return NextResponse.json({ code: "invalid_lesson_pack" }, { status: 400 });
    if (error instanceof LessonVersionConflictError) return NextResponse.json({ code: "lesson_version_conflict", message: error.message }, { status: 409 });
    logEvent("error", "import_failure", { operation: "targeted_lesson_import", errorType: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ code: "import_failed" }, { status: 500 });
  }
}
