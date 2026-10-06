// @vitest-environment node
import { expect, it } from "vitest";
import { PACK, loadGh } from "../tools/gh-import/mapper";
import { readJson } from "../tools/science-import/mapper";
import { capturePreservationSnapshot, assertPreservation } from "../tools/science-import/qa/preservation-audit";
import { importTrackPack, trackPackV2Schema } from "@/features/import/api";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { ContentQaRepository } from "@/db/repositories/content-qa-repository";
import { createMigratedPgliteTestDatabase } from "./integration/pglite-test-db";

it("imports 49 GH drafts idempotently, preserves Science/IFSC and rejects immutable rewrites atomically", async () => {
  const pack = trackPackV2Schema.parse(readJson(PACK)); const gh = loadGh();
  const database = await createMigratedPgliteTestDatabase();
  try {
    const repository = new DrizzleTrackImportRepository(database.db, "gh-qa-disposable");
    for (const f of ["packs/releases/ifsc-week-1.pack.json", "packs/drafts/ifsc-2027-science/science.pack.json"]) expect((await importTrackPack(readJson(f), repository)).status).toBe("imported");
    const options = { packId: pack.packId, trackId: pack.track.id, questionPattern: "^GH-V2-[0-9]{2}-Q[0-9]{3}$", reusedIds: gh.conceptMap.entries.filter(e => e.disposition === "existing").map(e => e.canonicalId) };
    const before = await capturePreservationSnapshot(database.db.$client, options);
    expect((await importTrackPack(pack, repository)).status).toBe("imported");
    expect((await importTrackPack(pack, repository)).status).toBe("already_imported");
    expect(assertPreservation(before, await capturePreservationSnapshot(database.db.$client, options)).unchanged).toBe(true);
    const lessons = pack.track.modules.flatMap(m => m.lessons); expect(lessons).toHaveLength(49); expect(pack.questions).toHaveLength(392);
    const qa = new ContentQaRepository(database.db);
    const release = await qa.register("gh-qa-disposable", "lesson", lessons[0].id, lessons[0].version);
    await expect(qa.publish(release.id)).rejects.toThrow("QA blocks");
    const changed = structuredClone(pack); changed.questions[0].stem = "Corrupted content";
    expect((await importTrackPack(changed, repository)).status).toBe("conflict");
    const immutable = structuredClone(pack); immutable.version++; immutable.track.modules[0].lessons[0].blocks[0].payload.content = "Corrupted lesson";
    await expect(importTrackPack(immutable, repository)).rejects.toThrow("Immutable content conflict");
    expect(await repository.findPackImport(pack.packId, immutable.version)).toBeNull();
    const state = await database.db.$client.query("SELECT (SELECT count(*) FROM owners) AS owners, (SELECT count(*) FROM attempts) AS attempts, (SELECT count(*) FROM study_events) AS events, (SELECT count(*) FROM concept_evidence) AS evidence, (SELECT count(*) FROM study_sessions) AS sessions");
    expect(state.rows).toEqual([{ owners: 0, attempts: 0, events: 0, evidence: 0, sessions: 0 }]);
    const orphan = await database.db.$client.query<{ count: number }>("SELECT count(*)::int AS count FROM question_concepts qc LEFT JOIN concepts c ON c.id=qc.concept_id LEFT JOIN question_versions v ON v.id=qc.question_version_id WHERE c.id IS NULL OR v.id IS NULL");
    expect(orphan.rows[0].count).toBe(0);
    expect(assertPreservation(before, await capturePreservationSnapshot(database.db.$client, options)).unchanged).toBe(true);
  } finally { await database.close(); }
}, 120000);
