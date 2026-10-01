import { eq } from "drizzle-orm";
import { expect, it } from "vitest";

import pack from "../../packs/seeds/ifsc-2027.foundation.track.v1.json";
import foundation from "../../packs/seeds/ifsc-2027.foundation.curriculum.json";
import subjects from "../../packs/seeds/ifsc-2027.module-subjects.json";
import { conceptPrerequisites, curriculumRequirements, modules, tracks } from "@/db/schema";
import { DrizzleCurriculumRepository } from "@/db/repositories/curriculum-repository";
import { importCurriculumFoundationSeed } from "@/features/curriculum/seed";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

it("migrates and seeds idempotently; derives partial coverage and rolls back conflicts/cycles", async () => {
  const database = await createMigratedPgliteTestDatabase();
  try {
    const first = await importCurriculumFoundationSeed(database.db, pack, foundation, subjects);
    const second = await importCurriculumFoundationSeed(database.db, pack, foundation, subjects);
    expect(first.status).toBe("imported");
    expect(second).toEqual({ ...first, status: "already_imported" });
    expect(await database.db.select().from(tracks)).toHaveLength(1);
    expect(await database.db.select().from(modules)).toHaveLength(4);
    expect(await database.db.select().from(curriculumRequirements)).toHaveLength(1);
    const repository = new DrizzleCurriculumRepository(database.db);
    const coverage = await repository.getCoverage(first.trackId);
    expect(coverage.summary.complete).toBe(false);
    expect(coverage.summary.sourceScopeVerified).toBe(false);
    expect(coverage.requirements[0]).toMatchObject({ state: "MAPPED", contentGaps: expect.arrayContaining(["MAT.PCT.INTERPRET"]) });
    const conflicting = structuredClone(foundation);
    conflicting.requirements[0].label = "Changed historical requirement";
    await expect(repository.applyFoundation(first.trackId, conflicting)).rejects.toThrow("create a new Track Pack version");
    expect((await database.db.select().from(curriculumRequirements))[0].label).toBe("Porcentagem");
    const cycle = structuredClone(foundation);
    cycle.prerequisites = [{ conceptId: "MAT.PCT.CONCEPT", prerequisiteConceptId: "MAT.PCT.CALCULATE", strength: "required" }];
    await expect(repository.applyFoundation(first.trackId, cycle)).rejects.toThrow("prerequisite_cycle");
    expect(await database.db.select().from(conceptPrerequisites).where(eq(conceptPrerequisites.trackId, first.trackId))).toHaveLength(foundation.prerequisites.length);
    const invalidPack = structuredClone(pack);
    invalidPack.packId += ".invalid";
    invalidPack.track.id += "-invalid";
    for (const moduleDefinition of invalidPack.track.modules) for (const lesson of moduleDefinition.lessons) lesson.version++;
    const invalidFoundation = structuredClone(foundation);
    invalidFoundation.requirements[0].sourceId = "missing";
    await expect(importCurriculumFoundationSeed(database.db, invalidPack, invalidFoundation, subjects)).rejects.toThrow("invalid_source");
    expect(await database.db.select().from(tracks)).toHaveLength(1);
  } finally { await database.close(); }
});
