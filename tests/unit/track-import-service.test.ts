import type { TrackPackLesson, TrackPackActivity } from "@/features/import/application/track-pack-schema";
import examplePack from "../../packs/examples/javascript-fundamentals.track.json";
import { describe, expect, it } from "vitest";

import {
  importTrackPack,
  previewTrackPack,
  type ExistingPackImport,
  type TrackImportRepository
} from "@/features/import/application/track-import-service";

function createRepository(existing: ExistingPackImport | null = null): TrackImportRepository & { applied: number } {
  return {
    applied: 0,
    async findPackImport() {
      return existing;
    },
    async applyTrackPack(pack) {
      this.applied += 1;

      return {
        trackStableId: pack.track.id,
        importedLessons: pack.track.modules.flatMap<TrackPackLesson>((module) => module.lessons).length,
        importedActivities: pack.track.modules.flatMap<TrackPackActivity>((module) =>
          module.lessons.flatMap<TrackPackActivity>((lesson) => lesson.activities)
        ).length
      };
    }
  };
}

describe("importTrackPack", () => {
  it("applies a valid new Track Pack through the repository boundary", async () => {
    const repository = createRepository();

    await expect(importTrackPack(examplePack, repository)).resolves.toMatchObject({
      status: "imported",
      packId: "know-os.javascript-fundamentals",
      version: 1,
      summary: {
        trackStableId: "javascript",
        importedLessons: 1,
        importedActivities: 2
      }
    });
    expect(repository.applied).toBe(1);
  });

  it("is idempotent when the same Pack version and content hash already exist", async () => {
    const firstRepository = createRepository();
    const first = await importTrackPack(examplePack, firstRepository);

    expect(first.status).toBe("imported");
    if (first.status !== "imported") {
      throw new Error("Expected initial import to succeed");
    }

    const validation = await import("@/features/import/application/track-pack-validation");
    const valid = validation.validateTrackPack(examplePack);
    if (!valid.ok) {
      throw new Error("Expected fixture to validate");
    }

    const repository = createRepository({
      packId: "know-os.javascript-fundamentals",
      version: 1,
      contentHash: valid.contentHash
    });

    await expect(importTrackPack(examplePack, repository)).resolves.toMatchObject({
      status: "already_imported"
    });
    expect(repository.applied).toBe(0);
  });

  it("reports a conflict when the same Pack version has different content", async () => {
    const repository = createRepository({
      packId: "know-os.javascript-fundamentals",
      version: 1,
      contentHash: "different"
    });

    await expect(importTrackPack(examplePack, repository)).resolves.toMatchObject({
      status: "conflict"
    });
    expect(repository.applied).toBe(0);
  });

  it("previews a new Track Pack without applying it", async () => {
    const repository = createRepository();

    await expect(previewTrackPack(examplePack, repository)).resolves.toMatchObject({
      status: "ready",
      operation: "import",
      packId: "know-os.javascript-fundamentals",
      summary: {
        trackStableId: "javascript",
        moduleCount: 1,
        lessonCount: 1,
        activityCount: 2,
        conceptCount: 3
      }
    });
    expect(repository.applied).toBe(0);
  });

  it("previews same-version content conflicts with stable diff metadata", async () => {
    const repository = createRepository({
      packId: "know-os.javascript-fundamentals",
      version: 1,
      contentHash: "different"
    });

    await expect(previewTrackPack(examplePack, repository)).resolves.toMatchObject({
      status: "conflict",
      operation: "blocked_conflict",
      existingContentHash: "different",
      diff: {
        type: "same_version_different_content",
        changed: ["content_hash"]
      }
    });
    expect(repository.applied).toBe(0);
  });
});

