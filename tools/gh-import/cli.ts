import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../src/db/schema";
import { DrizzleTrackImportRepository } from "../../src/db/repositories/track-import-repository";
import { importTrackPack } from "../../src/features/import/application/track-import-service";
import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { readJson, sha256 } from "../science-import/mapper";
import { capturePreservationSnapshot, assertPreservation } from "../science-import/qa/preservation-audit";
import { ALL, BATCHES, PILOT, OUTPUT, buildGhPack, runtimeId, sourcePins } from "./mapper";

function writeSealed(path: string, value: unknown, compact = false) {
  if (existsSync(path)) assert.equal(hashCanonicalJson(readJson(path)), hashCanonicalJson(value), `Sealed artifact changed: ${path}`);
  else { mkdirSync(resolve(path, ".."), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, compact ? undefined : 2)}\n`); }
}
export async function main() {
  const command = process.argv[2] ?? "preflight";
  assert(["preflight", "import", "validate"].includes(command));
  const index = process.argv.indexOf("--stage"); const stage = index < 0 ? "pilot" : process.argv[index + 1];
  assert(/^(pilot|batch[1-5])$/.test(stage));
  const batch = stage === "pilot" ? 0 : Number(stage.slice(5));
  const ids = [...PILOT, ...BATCHES.slice(0, batch).flat()].sort();
  const root = process.cwd(); const output = join(root, OUTPUT); const stageRoot = join(output, stage);
  if (batch) {
    const previous = batch === 1 ? "pilot" : `batch${batch - 1}`;
    const receipt = readJson(join(output, previous, "import-receipt.json")) as { idempotenceVerified: boolean; validationPassed: boolean };
    assert(receipt.idempotenceVerified && receipt.validationPassed, "Previous stage must be imported and validated");
    const gate = readJson(join(output, "pilot-qa.json")) as { passed: boolean };
    assert.equal(gate.passed, true, "Pilot renderer/evaluator/mobile QA must PASS before batches");
    assert.equal((gate as { passed: boolean; contentHash: string }).contentHash, hashCanonicalJson(readJson(join(output, "pilot/gh.pack.json"))), "Pilot QA refers to a different candidate");
  }
  const result = buildGhPack(ids, batch + 1); const pins = sourcePins();
  writeSealed(join(output, "source-pins.json"), pins);
  writeSealed(join(stageRoot, "gh.pack.json"), result.pack, true);
  const gh = result.gh;
  writeSealed(join(stageRoot, "editorial-sidecar.json"), { sourcePins: pins, sourcePacks: gh.originals.filter(r => ids.includes(r.lessonId)).map(r => r.pack), sourceLibrary: gh.library, conceptMap: gh.conceptMap, lessonIdMap: Object.fromEntries(ALL.map(id => [id, runtimeId(id)])), media: { authentic: gh.authentic, deterministic: gh.deterministic, illustrations: gh.illustrations }, integrationDefaults: { estimatedMinutes: 30, importance: "medium", provenance: "generated", cognitiveOperations: { RECALL: "recall", SOURCE_ANALYSIS: "analyze", TRANSFER: "apply" }, officialMappingVerified: false, taxonomyReviewPending: true, humanApprovalRecorded: false } });
  const report = { stage, lessons: ids.length, questions: result.pack.questions.length, conceptsMapped: gh.conceptMap.entries.filter(e => e.disposition === "existing").length, conceptsCreated: gh.conceptMap.entries.filter(e => e.disposition === "intentional_new").length, blocks: result.pack.track.modules.flatMap(m => m.lessons.flatMap(l => l.blocks)).length, sourceFiles: Object.keys(pins).length, contentHash: result.contentHash, bytes: result.byteLength, draftsOnly: true, mediaPending: 48, deterministicAssetsPending: 29, publicationPerformed: false, importPerformed: false };
  if (command !== "preflight") {
    const databasePath = join(output, "db"); const client = new PGlite(databasePath); await client.waitReady;
    try {
      const migrations = readdirSync("src/db/migrations").filter(f => f.endsWith(".sql")).sort();
      const migrationHash = sha256(migrations.map(f => `${f}:${sha256(readFileSync(`src/db/migrations/${f}`))}`).join("\n"));
      const ready = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_name='pack_imports'");
      if (!ready.rows[0].count) {
        assert.equal(command, "import", "Run import first"); await client.exec("BEGIN");
        try { for (const f of migrations) for (const sql of readFileSync(`src/db/migrations/${f}`, "utf8").split("--> statement-breakpoint")) if (sql.trim()) await client.exec(sql); await client.exec("COMMIT"); }
        catch (error) { await client.exec("ROLLBACK"); throw error; }
        writeSealed(`${databasePath}.migrations.json`, { migrationHash });
      } else assert.equal((readJson(`${databasePath}.migrations.json`) as { migrationHash: string }).migrationHash, migrationHash, "Local schema drift");
      const repository = new DrizzleTrackImportRepository(drizzle(client, { schema }), "gh-local-integration");
      const baselines = ["packs/releases/ifsc-week-1.pack.json", "packs/drafts/ifsc-2027-science/science.pack.json", ".local/mathematics-production/application/mathematics.pack.json"].filter(f => existsSync(f));
      if (command === "import") for (const f of baselines) { const imported = await importTrackPack(readJson(f), repository); assert(["imported", "already_imported"].includes(imported.status), JSON.stringify(imported)); }
      const options = { packId: result.pack.packId, trackId: result.pack.track.id, questionPattern: "^GH-V2-[0-9]{2}-Q[0-9]{3}$", reusedIds: gh.conceptMap.entries.filter(e => e.disposition === "existing").map(e => e.canonicalId) };
      const before = await capturePreservationSnapshot(client, options);
      const stateSql = "SELECT (SELECT count(*) FROM owners) AS owners, (SELECT count(*) FROM attempts) AS attempts, (SELECT count(*) FROM study_events) AS events, (SELECT count(*) FROM concept_evidence) AS evidence, (SELECT count(*) FROM study_sessions) AS sessions, (SELECT count(*) FROM lesson_progress) AS progress, (SELECT count(*) FROM question_exposures) AS exposures";
      const state = (await client.query(stateSql)).rows;
      if (command === "import") {
        const imported = await importTrackPack(result.pack, repository); assert(["imported", "already_imported"].includes(imported.status), JSON.stringify(imported));
        assert.equal((await importTrackPack(result.pack, repository)).status, "already_imported");
      }
      assert.equal((await repository.findPackImport(result.pack.packId, result.pack.version))?.contentHash, result.contentHash);
      const lessons = await client.query<{ stable_id: string; status: string }>("SELECT l.stable_id,l.metadata->>'status' AS status FROM lessons l JOIN modules m ON m.id=l.module_id JOIN tracks t ON t.id=m.track_id WHERE t.stable_id=$1 AND t.content_version=$2 ORDER BY l.stable_id", [result.pack.track.id, result.pack.version]);
      assert.deepEqual(lessons.rows.map(l => l.stable_id), ids.map(runtimeId)); assert(lessons.rows.every(l => l.status === "draft"));
      const blocks = await client.query<{ stable_id: string; payload: { title: string; content: string } }>("SELECT b.stable_id,b.payload FROM content_blocks b JOIN lessons l ON l.id=b.lesson_id JOIN modules m ON m.id=l.module_id JOIN tracks t ON t.id=m.track_id WHERE t.stable_id=$1 AND t.content_version=$2", [result.pack.track.id, result.pack.version]);
      assert.equal(blocks.rows.length, report.blocks);
      for (const block of result.pack.track.modules.flatMap(m => m.lessons.flatMap(l => l.blocks))) {
        const persisted = blocks.rows.find(b => b.stable_id === block.id); assert(persisted, `Missing persisted block ${block.id}`);
        assert.equal(persisted.payload.title, block.payload.title); assert.equal(persisted.payload.content, block.payload.content);
      }
      const expectedConcepts = result.pack.track.modules.flatMap(m => m.lessons.flatMap(l => l.concepts.map(c => c.id))).sort();
      const concepts = await client.query<{ stable_id: string }>("SELECT stable_id FROM concepts WHERE stable_id=ANY($1::text[]) ORDER BY stable_id", [expectedConcepts]);
      assert.deepEqual(concepts.rows.map(c => c.stable_id), expectedConcepts);
      const questions = await client.query<{ stable_id: string; status: string; content: unknown }>("SELECT q.stable_id,v.status,v.content FROM question_versions v JOIN questions q ON q.id=v.question_id WHERE q.stable_id ~ $1 ORDER BY q.stable_id", [options.questionPattern]);
      assert.equal(questions.rows.length, ids.length * 8); assert(questions.rows.every(q => q.status === "draft"));
      for (const question of result.pack.questions) assert.equal(hashCanonicalJson(questions.rows.find(q => q.stable_id === question.id)?.content), hashCanonicalJson(question), `Persisted Question drift ${question.id}`);
      assert.deepEqual((await client.query(stateSql)).rows, state, "Student state changed");
      const preservation = assertPreservation(before, await capturePreservationSnapshot(client, options));
      writeSealed(join(stageRoot, "preservation-audit.json"), preservation);
      report.importPerformed = true;
      const receiptPath = join(stageRoot, "import-receipt.json");
      // Validation updates the local receipt, while the canonical pack remains sealed.
      const receipt = { ...report, baselinePaths: baselines, idempotenceVerified: true, studentStateUnchanged: true, validationPassed: command === "validate" || (existsSync(receiptPath) && (readJson(receiptPath) as { validationPassed: boolean }).validationPassed) };
      writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    } finally { await client.close(); }
  }
  console.log(JSON.stringify(report));
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
