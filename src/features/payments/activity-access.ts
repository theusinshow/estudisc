import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDatabase, getDatabaseUrl } from "@/db/connection";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { activities, lessons } from "@/db/schema";
import { resolveAccessState, type AccessState } from "./access-guard";
import { isFreeSampleLessonId } from "./contracts";
import { logFunnelEvent } from "@/lib/funnel-events";

export type ActivityLessonLookup = (activityStableId: string) => Promise<readonly string[]>;

/** Stable ids of every lesson (any version) that contains the activity. */
export const findActivityLessonStableIds: ActivityLessonLookup = async (activityStableId) => {
  const url = getDatabaseUrl();
  if (!url || url === "memory://local") {
    return getMemoryStore().packImports.flatMap((entry) =>
      entry.manifest?.schema === "caderno.track.v2"
        ? entry.manifest.track.modules.flatMap((module) =>
            module.lessons.filter((lesson) => lesson.activities.some((activity) => activity.id === activityStableId)).map((lesson) => lesson.id)
          )
        : []
    );
  }
  const rows = await getDatabase()
    .selectDistinct({ stableId: lessons.stableId })
    .from(activities)
    .innerJoin(lessons, eq(lessons.id, activities.lessonId))
    .where(eq(activities.stableId, activityStableId));
  return rows.map((row) => row.stableId);
};

/**
 * Free preview (ADR 0061 §3): without full access, an activity is usable only when every lesson
 * that contains it is a free sample lesson. Unknown activities are left to the caller's own 404.
 */
export async function canAccessActivity(
  activityStableId: string,
  access: Pick<AccessState, "hasFullAccess">,
  lookup: ActivityLessonLookup = findActivityLessonStableIds
): Promise<boolean> {
  if (access.hasFullAccess) return true;
  const lessonIds = await lookup(activityStableId);
  return lessonIds.length === 0 || lessonIds.every(isFreeSampleLessonId);
}

export const PAID_ACCESS_REQUIRED_MESSAGE = "Este recurso faz parte do acesso completo do Estudisc.";

export function paidAccessRequiredResponse(message = PAID_ACCESS_REQUIRED_MESSAGE, operation = "feature") {
  logFunnelEvent("paid_feature_blocked", { operation });
  return NextResponse.json({ code: "paid_access_required", message }, { status: 403 });
}

/** Returns a 403 response when the current owner lacks full access, otherwise null. */
export async function denyWithoutFullAccess(message: string | undefined, operation: string): Promise<NextResponse | null> {
  const access = await resolveAccessState();
  return access.hasFullAccess ? null : paidAccessRequiredResponse(message, operation);
}
