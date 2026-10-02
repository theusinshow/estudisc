import { describe, expect, it } from "vitest";

import { buildExportPayload, buildExportPreview } from "@/features/export/export-contracts";
import type { ExportSnapshot } from "@/db/repositories/export-repository";

const now = new Date("2026-07-30T12:00:00.000Z");

function createSnapshot(): ExportSnapshot {
  return {
    packManifests: [{ schema: "caderno.track.v1" }],
    tracks: [{ stableId: "javascript", title: "JavaScript", description: null, lessonCount: 1 }],
    knowledgeMap: [
      {
        stableId: "js-logical-and",
        title: "Logical AND",
        summary: null,
        lessonCount: 1,
        trackTitles: ["JavaScript"],
        areaTitles: ["Fundamentos"]
      }
    ],
    masteryEvidence: [
      {
        id: "evidence-1",
        conceptStableId: "js-logical-and",
        conceptTitle: "Logical AND",
        type: "code_written",
        strength: 2,
        sourceType: "activity_attempt",
        sourceId: "attempt-1",
        conditions: {},
        createdAt: now
      }
    ],
    recentAttempts: Array.from({ length: 6 }, (_, index) => ({
      id: `attempt-${index + 1}`,
      activityStableId: "activity-1",
      activityType: "code",
      activityPrompt: "Prompt",
      attemptNumber: index + 1,
      outcome: "passed",
      source: "const value = true;",
      createdAt: now
    })),
    dueReviews: [],
    mistakes: [],
    projects: [
      {
        stableId: "project-1",
        title: "Project",
        description: null,
        status: "active",
        conceptCount: 1,
        activityCount: 1
      }
    ],
    xpSummary: {
      totalXp: 60,
      transactions: [
        {
          id: "xp-1",
          amount: 60,
          reason: "code_activity_passed",
          sourceType: "attempt",
          sourceId: "attempt-1",
          createdAt: now
        }
      ]
    },
    gamification: {
      badgeAwards: [
        {
          badgeId: "first-submit",
          label: "First Submit",
          criteriaSnapshot: "Registrar a primeira tentativa aprovada com SUBMIT SOLUTION.",
          sourceType: "gamification_rule",
          sourceId: "gamification.v1:first-submit",
          createdAt: now
        }
      ],
      missionProgress: [
        {
          missionId: "continue-learning",
          label: "Continuar aprendizagem",
          criteriaSnapshot: "Concluir a próxima atividade recomendada.",
          status: "complete",
          href: "/tracks",
          completedAt: now,
          sourceType: "gamification_rule",
          sourceId: "gamification.v1:continue-learning",
          updatedAt: now
        }
      ],
      missionEvents: []
    },
    events: []
  };
}

describe("export contracts", () => {
  it("previews backup exports with private-data warnings", () => {
    const preview = buildExportPreview("backup", createSnapshot());

    expect(preview.approximateRecordCount).toBeGreaterThan(0);
    expect(preview.categories.map((category) => category.id)).toContain("recent_attempts");
    expect(preview.categories.map((category) => category.id)).toContain("gamification");
    expect(preview.warnings).toEqual(
      expect.arrayContaining([
        "Revise antes de compartilhar: este export pode incluir dados privados de estudo.",
        "Inclui código-fonte submetido em tentativas recentes.",
        "Inclui contexto de projetos, que pode revelar objetivos pessoais ou profissionais."
      ])
    );
  });

  it("limits Teacher Context payload attempts while preserving privacy metadata", () => {
    const payload = buildExportPayload({
      kind: "teacher_context",
      snapshot: createSnapshot(),
      selectedLessonStableId: "js-fundamentals-001",
      exportedAt: now
    });

    expect(payload).toMatchObject({
      schema: "know-os.export.v1",
      kind: "teacher_context",
      exportedAt: "2026-07-30T12:00:00.000Z",
      privacy: {
        includesPrivateSourceCode: true,
        includesProjectContext: true
      }
    });
    expect((payload.payload as { recentAttempts: unknown[] }).recentAttempts).toHaveLength(5);
  });
});
