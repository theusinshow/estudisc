import type { TrackPack, TrackPackLesson, TrackPackActivity } from "@/features/import/application/track-pack-schema";
import { validateTrackPack, type TrackPackIssue } from "@/features/import/application/track-pack-validation";

export type ExistingPackImport = Readonly<{
  packId: string;
  version: number;
  contentHash: string;
}>;

export type AppliedTrackImport = Readonly<{
  trackStableId: string;
  importedLessons: number;
  importedActivities: number;
}>;

export type TrackPackPreviewSummary = Readonly<{
  trackStableId: string;
  trackTitle: string;
  moduleCount: number;
  lessonCount: number;
  activityCount: number;
  conceptCount: number;
}>;

export type TrackImportRepository = Readonly<{
  findPackImport(packId: string, version: number): Promise<ExistingPackImport | null>;
  applyTrackPack(pack: TrackPack, contentHash: string): Promise<AppliedTrackImport>;
}>;

export type TrackImportResult =
  | Readonly<{ status: "imported"; packId: string; version: number; summary: AppliedTrackImport }>
  | Readonly<{ status: "already_imported"; packId: string; version: number }>
  | Readonly<{
      status: "conflict";
      packId: string;
      version: number;
      message: string;
      existingContentHash: string;
      incomingContentHash: string;
    }>
  | Readonly<{ status: "invalid"; issues: TrackPackIssue[] }>;

export type TrackImportPreviewResult =
  | Readonly<{
      status: "ready";
      operation: "import";
      packId: string;
      version: number;
      contentHash: string;
      summary: TrackPackPreviewSummary;
    }>
  | Readonly<{
      status: "already_imported";
      operation: "no_change";
      packId: string;
      version: number;
      contentHash: string;
      summary: TrackPackPreviewSummary;
    }>
  | Readonly<{
      status: "conflict";
      operation: "blocked_conflict";
      packId: string;
      version: number;
      message: string;
      existingContentHash: string;
      incomingContentHash: string;
      summary: TrackPackPreviewSummary;
      diff: Readonly<{
        type: "same_version_different_content";
        changed: readonly ["content_hash"];
      }>;
    }>
  | Readonly<{ status: "invalid"; operation: "blocked_invalid"; issues: TrackPackIssue[] }>;

export async function previewTrackPack(
  input: unknown,
  repository: TrackImportRepository
): Promise<TrackImportPreviewResult> {
  const validation = validateTrackPack(input);

  if (!validation.ok) {
    return { status: "invalid", operation: "blocked_invalid", issues: validation.issues };
  }

  const { pack, contentHash } = validation;
  const summary = summarizeTrackPack(pack);
  const existing = await repository.findPackImport(pack.packId, pack.version);

  if (existing) {
    if (existing.contentHash === contentHash) {
      return {
        status: "already_imported",
        operation: "no_change",
        packId: pack.packId,
        version: pack.version,
        contentHash,
        summary
      };
    }

    return {
      status: "conflict",
      operation: "blocked_conflict",
      packId: pack.packId,
      version: pack.version,
      message: "Same Pack ID and version already exist with different content.",
      existingContentHash: existing.contentHash,
      incomingContentHash: contentHash,
      summary,
      diff: {
        type: "same_version_different_content",
        changed: ["content_hash"]
      }
    };
  }

  return {
    status: "ready",
    operation: "import",
    packId: pack.packId,
    version: pack.version,
    contentHash,
    summary
  };
}

export async function importTrackPack(input: unknown, repository: TrackImportRepository): Promise<TrackImportResult> {
  const validation = validateTrackPack(input);

  if (!validation.ok) {
    return { status: "invalid", issues: validation.issues };
  }

  const { pack, contentHash } = validation;
  const existing = await repository.findPackImport(pack.packId, pack.version);

  if (existing) {
    if (existing.contentHash === contentHash) {
      return { status: "already_imported", packId: pack.packId, version: pack.version };
    }

    return {
      status: "conflict",
      packId: pack.packId,
      version: pack.version,
      message: "Same Pack ID and version already exist with different content.",
      existingContentHash: existing.contentHash,
      incomingContentHash: contentHash
    };
  }

  const summary = await repository.applyTrackPack(pack, contentHash);

  return {
    status: "imported",
    packId: pack.packId,
    version: pack.version,
    summary
  };
}

export function summarizeTrackPack(pack: TrackPack): TrackPackPreviewSummary {
  const lessons = pack.track.modules.flatMap<TrackPackLesson>((moduleDefinition) => moduleDefinition.lessons);
  const activities = lessons.flatMap<TrackPackActivity>((lesson) => lesson.activities);
  const conceptIds = new Set(lessons.flatMap((lesson) => lesson.concepts.map((concept) => concept.id)));

  return {
    trackStableId: pack.track.id,
    trackTitle: pack.track.title,
    moduleCount: pack.track.modules.length,
    lessonCount: lessons.length,
    activityCount: activities.length,
    conceptCount: conceptIds.size
  };
}
