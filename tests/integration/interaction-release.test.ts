import { afterEach, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { interactionBatchFileSchema, releaseInteractions } from "../../tools/estudisc-content-studio/interaction-release";
import { appendInteractions } from "../../tools/estudisc-content-studio/interaction-batch";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

let fixtureDb: Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>> | undefined;
afterEach(async () => { await fixtureDb?.close(); fixtureDb = undefined; });

const admin = { ownerId: "fixture-admin", role: "ADMIN" as const };
const reason = "Disposable fixture: actual Admin Direct path, no editorial approvals fabricated.";

it("keeps the authored F5 batch valid", () => {
  const batch = interactionBatchFileSchema.parse(JSON.parse(readFileSync("packs/drafts/interactions/2026-10-17-f5a.authoring.json", "utf8")));
  expect(batch.interactions).toHaveLength(10);
});

it("previews by default, then appends to the newest published version and continues the numbering", async () => {
  const { context, base } = lessonVersionFixture();
  fixtureDb = await createMigratedPgliteTestDatabase();
  const db = fixtureDb.db as never;
  await new DrizzleTrackImportRepository(db, "fixture-admin").applyTrackPack(context, hashCanonicalJson(context));
  await new ContentQaRepository(db).publishLessonsDirect(admin, { lessons: [{ lessonId: base.id, version: base.version }], reason });
  const common = { lessonId: base.id, conceptId: base.concepts[0].id, difficulty: "direct", explanation: "Explicação curta que justifica a resposta esperada." };
  const batch = (id: string, stem: string) => ({ batchId: id, interactions: [{ ...common, type: "ordering", stem, items: ["Ler o enunciado", "Montar a conta", "Conferir o resultado"] }] });

  const preview = await releaseInteractions(db, { batch: batch("fixture-a", "Ordene as etapas do procedimento."), actor: admin, reason, publish: false });
  expect(preview).toEqual([{ lessonId: base.id, from: base.version, to: base.version + 1, questions: [`${base.id}-INT-Q01`], blocks: [], status: "ready" }]);

  expect((await releaseInteractions(db, { batch: batch("fixture-a", "Ordene as etapas do procedimento."), actor: admin, reason, publish: true }))[0].status).toBe("imported+published");
  const second = await releaseInteractions(db, { batch: batch("fixture-b", "Ordene de novo as etapas do procedimento."), actor: admin, reason, publish: true });
  expect(second).toEqual([{ lessonId: base.id, from: base.version + 1, to: base.version + 2, questions: [`${base.id}-INT-Q02`], blocks: [], status: "imported+published" }]);
});

it("inserts an explorer at the end of its Concept's section and previews a blocks-only version", async () => {
  const { context, base } = lessonVersionFixture();
  const concept = base.blocks.find(block => block.type === "concept")!;
  const explorer = { lessonId: base.id, conceptId: concept.conceptIds[0], payload: { mode: "percent-grid" as const, title: "Grade", initial: 10, target: 35, explanation: "Cada quadradinho vale 1%." } };
  const pack = appendInteractions({ context, moduleId: "mat", base, authored: [], explorers: [explorer], packId: "estudisc.explorer.fixture", authorId: "fixture-admin", generationRunId: "explorer-test" });
  const blocks = pack.lesson.blocks, at = blocks.findIndex(block => block.id === `BLK-${base.id}-EXP01`);
  expect(at).toBeGreaterThan(blocks.indexOf(blocks.find(block => block.id === concept.id)!));
  expect(["concept", "summary", "prediction"]).toContain(blocks[at + 1]?.type ?? "summary");
  expect(blocks.filter((_, index) => index !== at)).toEqual(base.blocks);

  fixtureDb = await createMigratedPgliteTestDatabase();
  const db = fixtureDb.db as never;
  await new DrizzleTrackImportRepository(db, "fixture-admin").applyTrackPack(context, hashCanonicalJson(context));
  await new ContentQaRepository(db).publishLessonsDirect(admin, { lessons: [{ lessonId: base.id, version: base.version }], reason });
  expect(await releaseInteractions(db, { batch: { batchId: "fixture-explorer", explorers: [explorer] }, actor: admin, reason, publish: false }))
    .toEqual([{ lessonId: base.id, from: base.version, to: base.version + 1, questions: [], blocks: [`BLK-${base.id}-EXP01`], status: "ready" }]);
});
