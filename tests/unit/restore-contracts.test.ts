import { describe, expect, it } from "vitest";

import examplePack from "../../packs/examples/javascript-fundamentals.track.json";
import { applyBackupRestore } from "@/features/restore/api";
import { buildUserStateRestoreDryRunPlan, previewRestore } from "@/features/restore/restore-contracts";
import type { TrackImportRepository } from "@/features/import/api";

const backupExport = {
  schema: "know-os.export.v1",
  kind: "backup",
  exportedAt: "2026-07-30T12:00:00.000Z",
  privacy: {
    warnings: [],
    includesPrivateSourceCode: true,
    includesProjectContext: true
  },
  payload: {
    packManifests: [examplePack],
    tracks: [{}],
    knowledgeMap: [{}],
    masteryEvidence: [{}],
    recentAttempts: [{}],
    dueReviews: [],
    mistakes: [],
    projects: [{}],
    xpSummary: {
      totalXp: 60,
      transactions: [{}]
    },
    events: [{}]
  }
};

describe("previewRestore", () => {
  it("builds a non-destructive restore preview for Backup exports", () => {
    expect(previewRestore(backupExport)).toMatchObject({
      status: "ready",
      schema: "estudisc.restore-preview.v1",
      sourceExportedAt: "2026-07-30T12:00:00.000Z",
      applicationMode: "non_destructive_plan",
      userStatePlan: {
        schema: "estudisc.user-state-restore-dry-run.v1",
        mode: "user_state_dry_run",
        applyEnabled: false
      },
      categories: expect.any(Array)
    });
    expect(previewRestore(backupExport)).toMatchObject({
      status: "ready",
      categories: expect.arrayContaining([
        expect.objectContaining({ id: "pack_manifests", count: 1, private: false }),
        expect.objectContaining({ id: "content_references", count: 1, private: false }),
        expect.objectContaining({ id: "attempts", count: 1, private: true }),
        expect.objectContaining({ id: "projects", count: 1, private: true })
      ])
    });
  });

  it("rejects non-backup export kinds", () => {
    expect(previewRestore({ ...backupExport, kind: "teacher_context" })).toMatchObject({
      status: "invalid",
      code: "unsupported_restore_kind"
    });
  });

  it("builds a blocked user-state dry-run plan with a stable source fingerprint", () => {
    const first = buildUserStateRestoreDryRunPlan({
      sourceExport: backupExport,
      payload: backupExport.payload
    });
    const second = buildUserStateRestoreDryRunPlan({
      sourceExport: { ...backupExport },
      payload: backupExport.payload
    });

    expect(first.sourceExportFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(first.sourceExportFingerprint).toBe(second.sourceExportFingerprint);
    expect(first.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "user_state_apply_not_implemented" }),
        expect.objectContaining({ code: "restore_provenance_required" })
      ])
    );
    expect(first.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "attempts", sourceCount: 1, status: "blocked" }),
        expect.objectContaining({ id: "xp", sourceCount: 1, status: "blocked" }),
        expect.objectContaining({ id: "pack_manifests", sourceCount: 1, status: "plan_only" })
      ])
    );
  });

  it("blocks user-state dry-run when the Backup has state without Pack manifests", () => {
    const payload = {
      ...backupExport.payload,
      packManifests: []
    };
    const plan = buildUserStateRestoreDryRunPlan({
      sourceExport: { ...backupExport, payload },
      payload
    });

    expect(plan.blockers).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "pack_manifest_required_for_user_state" })])
    );
  });

  it("applies Pack manifests non-destructively and skips automatic user-state overwrite", async () => {
    const repository: TrackImportRepository & { applied: number } = {
      applied: 0,
      async findPackImport() {
        return null;
      },
      async applyTrackPack() {
        this.applied += 1;

        return {
          trackStableId: "javascript",
          importedLessons: 1,
          importedActivities: 2
        };
      }
    };

    await expect(applyBackupRestore(backupExport, repository)).resolves.toMatchObject({
      status: "applied",
      restoredPacks: 1,
      alreadyImportedPacks: 0,
      skippedUserStateCategories: expect.arrayContaining(["attempts", "mastery_evidence", "gamification", "history"])
    });
    expect(repository.applied).toBe(1);
  });
});
