import examplePack from "../../packs/examples/javascript-fundamentals.track.json";
import { afterEach, describe, expect, it } from "vitest";

import { CatalogRepository } from "@/db/repositories/catalog-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { importTrackPack } from "@/features/import/api";

import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

type TestDb = Awaited<ReturnType<typeof createMigratedPgliteTestDatabase>>;

describe("CatalogRepository", () => {
  let testDb: TestDb | undefined;

  afterEach(async () => {
    await testDb?.close();
    testDb = undefined;
  });

  it("reads imported concept details and lesson relationships", async () => {
    testDb = await createMigratedPgliteTestDatabase();
    await importTrackPack(examplePack, new DrizzleTrackImportRepository(testDb.db as never));

    const repository = new CatalogRepository(testDb.db as never);
    const concept = await repository.getConcept("js-logical-and");

    expect(concept).toMatchObject({
      stableId: "js-logical-and",
      title: "Logical AND",
      lessons: [
        {
          stableId: "js-fundamentals-001",
          title: "Variáveis, tipos e operadores",
          trackStableId: "javascript",
          activityCount: 2
        }
      ]
    });

    await expect(repository.listKnowledgeMapConcepts()).resolves.toEqual([
      {
        stableId: "js-logical-and",
        title: "Logical AND",
        summary: "Retorna verdadeiro quando ambas as condições são verdadeiras.",
        lessonCount: 1,
        trackTitles: ["JavaScript"],
        areaTitles: ["Fundamentos"]
      },
      {
        stableId: "js-type-number",
        title: "Number",
        summary: "Representa valores numéricos.",
        lessonCount: 1,
        trackTitles: ["JavaScript"],
        areaTitles: ["Fundamentos"]
      },
      {
        stableId: "js-type-string",
        title: "String",
        summary: "Representa texto.",
        lessonCount: 1,
        trackTitles: ["JavaScript"],
        areaTitles: ["Fundamentos"]
      }
    ]);
  });
});
