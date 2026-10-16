import { getEntitlementRepository, type EntitlementRepository } from "@/db/repositories/entitlement-repository";
import { getOwnerProfile, type OwnerProfile } from "@/features/auth/owner";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import {
  FREE_SAMPLE_LESSON_IDS,
  isFreeSampleLessonId,
  LIFETIME_PRODUCT_ID,
  type EntitlementRecord,
  type EntitlementSource
} from "./contracts";

export type AccessSource =
  | "feature_flag_off"
  | "admin"
  | "allowlist"
  | EntitlementSource
  | "free_preview";

export type AccessState = Readonly<{
  hasFullAccess: boolean;
  source: AccessSource;
  entitlement: EntitlementRecord | null;
  sampleLessonIds: readonly string[];
}>;

export class PaidAccessRequiredError extends Error {
  constructor(public readonly reason: "lesson_locked" | "feature_locked" = "feature_locked") {
    super("Este recurso requer o acesso completo do Estudisc.");
  }
}

export async function resolveAccessState(
  profile?: OwnerProfile,
  env: ServerEnv = getServerEnv(),
  repo: EntitlementRepository = getEntitlementRepository(),
  now: Date = new Date()
): Promise<AccessState> {
  if (!env.FEATURE_PAID_ACCESS) {
    return {
      hasFullAccess: true,
      source: "feature_flag_off",
      entitlement: null,
      sampleLessonIds: FREE_SAMPLE_LESSON_IDS
    };
  }

  const resolvedProfile = profile ?? (await getOwnerProfile());

  if (resolvedProfile.role === "ADMIN") {
    return {
      hasFullAccess: true,
      source: "admin",
      entitlement: null,
      sampleLessonIds: FREE_SAMPLE_LESSON_IDS
    };
  }

  if (resolvedProfile.allowlisted) {
    return {
      hasFullAccess: true,
      source: "allowlist",
      entitlement: null,
      sampleLessonIds: FREE_SAMPLE_LESSON_IDS
    };
  }

  const { active, latest } = await repo.hasActiveEntitlement(
    resolvedProfile.ownerId,
    now,
    LIFETIME_PRODUCT_ID
  );

  if (active && latest) {
    return {
      hasFullAccess: true,
      source: latest.source,
      entitlement: latest,
      sampleLessonIds: FREE_SAMPLE_LESSON_IDS
    };
  }

  return {
    hasFullAccess: false,
    source: "free_preview",
    entitlement: latest,
    sampleLessonIds: FREE_SAMPLE_LESSON_IDS
  };
}

export function canAccessLesson(lessonStableId: string, access: Pick<AccessState, "hasFullAccess">): boolean {
  if (access.hasFullAccess) {
    return true;
  }
  return isFreeSampleLessonId(lessonStableId);
}

export async function requireFullAccess(
  profile?: OwnerProfile,
  env: ServerEnv = getServerEnv(),
  repo: EntitlementRepository = getEntitlementRepository(),
  now: Date = new Date()
): Promise<AccessState> {
  const state = await resolveAccessState(profile, env, repo, now);
  if (!state.hasFullAccess) {
    throw new PaidAccessRequiredError("feature_locked");
  }
  return state;
}
