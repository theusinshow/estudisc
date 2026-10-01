import { trackPackSchema, type TrackPack } from "@/features/import/application/track-pack-schema";
import {
  validateLessonChildren,
  type PackValidationIssue
} from "@/features/import/application/lesson-pack-validation";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { trackPackV2Schema } from "./track-pack-v2-schema";
import { validateTrackPackV2Semantics } from "./track-pack-v2-validation";

export type TrackPackIssue = Readonly<{ code: string; message: string; path: string }>;

export type TrackPackValidationResult =
  | Readonly<{ ok: true; pack: TrackPack; contentHash: string }>
  | Readonly<{ ok: false; issues: TrackPackIssue[] }>;

export function validateTrackPack(input: unknown): TrackPackValidationResult {
  const isV2 = typeof input === "object" && input !== null && "schema" in input && input.schema === "caderno.track.v2";
  const parsed = isV2 ? trackPackV2Schema.safeParse(input) : trackPackSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        code: "invalid_schema",
        message: issue.message,
        path: issue.path.join(".")
      }))
    };
  }

  const semanticIssues = parsed.data.schema === "caderno.track.v2" ? validateTrackPackV2Semantics(parsed.data) : validateSemantics(parsed.data);

  if (semanticIssues.length > 0) {
    return { ok: false, issues: semanticIssues };
  }

  return {
    ok: true,
    pack: parsed.data,
    contentHash: hashTrackPack(parsed.data)
  };
}

export function hashTrackPack(pack: TrackPack) {
  return hashCanonicalJson(pack);
}

function validateSemantics(pack: TrackPack): TrackPackIssue[] {
  const issues: PackValidationIssue[] = [];
  const ids = new Map<string, string>();

  addUnique(ids, issues, pack.track.id, "track.id");

  pack.track.modules.forEach((module, moduleIndex) => {
    const modulePath = `track.modules.${moduleIndex}`;
    addUnique(ids, issues, module.id, `${modulePath}.id`);

    module.lessons.forEach((lesson, lessonIndex) => {
      const lessonPath = `${modulePath}.lessons.${lessonIndex}`;

      addUnique(ids, issues, lesson.id, `${lessonPath}.id`);
      validateLessonChildren(lesson, lessonPath, ids, issues);
    });
  });

  return issues;
}

function addUnique(ids: Map<string, string>, issues: TrackPackIssue[], id: string, path: string) {
  const existingPath = ids.get(id);

  if (existingPath) {
    issues.push({
      code: "duplicate_id",
      message: `Stable ID '${id}' is already used at ${existingPath}.`,
      path
    });
    return;
  }

  ids.set(id, path);
}
