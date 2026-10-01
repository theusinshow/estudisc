import { expect, it } from "vitest";
import v1 from "../../packs/examples/javascript-fundamentals.track.json";
import example from "../../packs/examples/ifsc-2027.minimal.track.v2.json";
import { importTrackPack } from "@/features/import/api";
import { tracks, questionVersions } from "@/db/schema";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { DrizzleQuestionRepository } from "@/db/repositories/question-repository";
import { DrizzleCurriculumRepository } from "@/db/repositories/curriculum-repository";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

it("imports both versions atomically, preserves frozen Questions and rejects version conflicts", async () => {
  const database = await createMigratedPgliteTestDatabase();
  try {
    const repository = new DrizzleTrackImportRepository(database.db);
    expect((await importTrackPack(v1, repository)).status).toBe("imported");
    const candidate = structuredClone(example);
    candidate.track.modules[0].lessons[0].blocks = [];
    candidate.track.modules[0].lessons[0].activities = [];
    expect((await importTrackPack(candidate, repository)).status).toBe("imported");
    expect((await importTrackPack(candidate, repository)).status).toBe("already_imported");
    const allTracks = await database.db.select().from(tracks);
    const ifsc = allTracks.find(track => track.stableId === "ifsc-2027")!;
    expect((await new DrizzleCurriculumRepository(database.db).getCoverage(ifsc.id)).summary.complete).toBe(false);
    const bank = new DrizzleQuestionRepository(database.db);
    expect((await bank.getVersion("Q-MAT-PCT-001", 1))?.question.answer).toMatchObject({ value: 30 });
    const conflicting = structuredClone(candidate);
    conflicting.questions[0].answer.value = 31;
    expect((await importTrackPack(conflicting, repository)).status).toBe("conflict");
    const update = structuredClone(conflicting);
    update.version++;
    update.track.modules[0].lessons[0].version++;
    await expect(importTrackPack(update, repository)).rejects.toThrow("Question version already exists");
    expect(await database.db.select().from(tracks)).toHaveLength(2); // Failed update rolled back.
    update.questions[0].version++;
    expect((await importTrackPack(update, repository)).status).toBe("imported");
    expect(await database.db.select().from(questionVersions)).toHaveLength(2);
    expect((await bank.getVersion("Q-MAT-PCT-001", 1))?.question.answer).toMatchObject({ value: 30 });
    expect((await bank.getVersion("Q-MAT-PCT-001", 2))?.question.answer).toMatchObject({ value: 31 });
  } finally { await database.close(); }
});
