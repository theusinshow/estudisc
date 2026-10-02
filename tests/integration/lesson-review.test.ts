import { describe, expect, it } from "vitest";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { qaLayers, releaseAuthor } from "@/features/content-qa/policy";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

const approvals = qaLayers.map(layer => ({ layer, verdict: "APPROVE", rationale: "Conferi conteúdo, gabaritos e alinhamento nesta fixture.", findings: [] }));

describe("release authorship (ADR 0033)", () => {
  const sources = [{ id: "ai", type: "ai_generated", metadata: { authorRunId: "run-1" } }, { id: "edital", type: "official_document" }];
  it("attributes content to its author and falls back to the importer", () => {
    expect(releaseAuthor({ kind: "question", question: { provenance: { type: "generated", generationRunId: "run-1" } } }, sources, "owner")).toBe("ai:run-1");
    expect(releaseAuthor({ kind: "question", question: { provenance: { type: "official_exam", examId: "ifsc-2025-1" } } }, sources, "owner")).toBe("exam:ifsc-2025-1");
    expect(releaseAuthor({ kind: "question", question: { provenance: { type: "human_created" } } }, sources, "owner")).toBe("owner");
    expect(releaseAuthor({ kind: "lesson", lesson: { sourceIds: ["edital", "ai"] } }, sources, "owner")).toBe("ai:run-1");
    expect(releaseAuthor({ kind: "lesson", lesson: { sourceIds: ["edital"] } }, sources, "owner")).toBe("owner");
    expect(releaseAuthor({ kind: "curriculum" }, sources, "owner")).toBe("owner");
  });
});

describe("per-lesson review", () => {
  it("lets the importing owner review AI-authored content and publishes the lesson with its questions", async () => {
    const database = await createMigratedPgliteTestDatabase();
    try {
      expect((await importTrackPack(structuredClone(source), new DrizzleTrackImportRepository(database.db, "owner"))).status).toBe("imported");
      const repo = new ContentQaRepository(database.db);
      const entry = (await repo.lessonQueue()).find(item => item.lesson.id === "POR-01")!;
      expect(entry.release?.authorId).toBe("ai:ifsc-golden-author-v1");
      expect(entry.questions).toHaveLength(10);

      await expect(repo.reviewLesson("owner", "POR-01", 1, approvals.slice(0, 3), true)).rejects.toThrow("QA blocks");
      expect((await repo.lessonQueue()).find(item => item.lesson.id === "POR-01")!.release?.status).toBe("draft");

      expect(await repo.reviewLesson("owner", "POR-01", 1, approvals, true)).toMatchObject({ published: true, releases: 11 });
      const after = (await repo.lessonQueue()).find(item => item.lesson.id === "POR-01")!;
      expect(after.release?.status).toBe("published");
      expect(after.questions.every(question => question.release?.status === "published")).toBe(true);
    } finally {
      await database.close();
    }
  }, 60000);

  it("still refuses self-review for content the owner wrote", async () => {
    const database = await createMigratedPgliteTestDatabase();
    try {
      const fixture = structuredClone(source);
      for (const question of fixture.questions) Object.assign(question, { provenance: { type: "human_created" } });
      fixture.sources = fixture.sources.filter((item: { type: string }) => item.type !== "ai_generated");
      for (const trackModule of fixture.track.modules) for (const lesson of trackModule.lessons) lesson.sourceIds = lesson.sourceIds.filter((id: string) => fixture.sources.some((item: { id: string }) => item.id === id));
      for (const question of fixture.questions) question.sourceIds = question.sourceIds.filter((id: string) => fixture.sources.some((item: { id: string }) => item.id === id));
      expect((await importTrackPack(fixture, new DrizzleTrackImportRepository(database.db, "owner"))).status).toBe("imported");
      await expect(new ContentQaRepository(database.db).reviewLesson("owner", "POR-01", 1, approvals, true)).rejects.toThrow("Independent");
    } finally {
      await database.close();
    }
  }, 60000);
});
