import { afterEach, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { interactionBatchFileSchema, releaseInteractions } from "../../tools/estudisc-content-studio/interaction-release";
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
  expect(preview).toEqual([{ lessonId: base.id, from: base.version, to: base.version + 1, questions: [`${base.id}-INT-Q01`], status: "ready" }]);

  expect((await releaseInteractions(db, { batch: batch("fixture-a", "Ordene as etapas do procedimento."), actor: admin, reason, publish: true }))[0].status).toBe("imported+published");
  const second = await releaseInteractions(db, { batch: batch("fixture-b", "Ordene de novo as etapas do procedimento."), actor: admin, reason, publish: true });
  expect(second).toEqual([{ lessonId: base.id, from: base.version + 1, to: base.version + 2, questions: [`${base.id}-INT-Q02`], status: "imported+published" }]);
});
