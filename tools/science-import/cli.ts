import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../src/db/schema";
import { DrizzleTrackImportRepository } from "../../src/db/repositories/track-import-repository";
import { importTrackPack } from "../../src/features/import/application/track-import-service";
import { hashCanonicalJson } from "../../src/lib/canonical-json";
import { BATCHES, PILOT, mediaAssetsSchema } from "./contracts";
import { buildSciencePack, readJson, sha256, validateConceptMap } from "./mapper";
import { capturePreservationSnapshot, assertPreservation } from "./qa/preservation-audit";

const root = process.cwd();
const outputRoot = resolve(root, ".local/science-integration");
function writeJson(path: string, value: unknown) { mkdirSync(resolve(path, ".."), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function argument(name: string, fallback: string) { const index = process.argv.indexOf(name); return index === -1 ? fallback : process.argv[index + 1]; }
export async function main() {
  const command = process.argv[2] ?? "preflight";
  assert(["preflight", "build", "import", "validate"].includes(command), "Commands: preflight|build|import|validate");
  const stage = argument("--stage", "pilot");
  assert(/^(pilot|batch[1-5]|media)$/.test(stage), "Stage: pilot|batch1..batch5|media");
  const batchCount = stage === "pilot" ? 0 : stage === "media" ? 5 : Number(stage.slice(5));
  const selected = [...PILOT, ...BATCHES.slice(0, batchCount).flat()].sort();
  const mediaPath = argument("--media", "");
  const media = mediaPath ? mediaAssetsSchema.parse(readJson(resolve(root, mediaPath))) : { assets: [] };
  const result = buildSciencePack(root, selected, stage === "media" ? 7 : batchCount + 1, undefined, media);
  const existing = readJson(resolve(root, ".vecta-agent-context/EXISTING-CONCEPTS.json")) as { id: string }[];
  validateConceptMap(result.inputs.conceptMap, result.inputs.packs.flatMap(row => row.pack.lesson.concepts.map(concept => concept.id)), new Set(existing.map(row => row.id)));
  const manifest = readJson(join(result.inputs.sourceRoot, "IMPORT-MANIFEST.json")) as { lessons: { lessonId: string; hash: string }[] };
  const staleManifestHashes = result.inputs.packs.filter(row => manifest.lessons.find(entry => entry.lessonId === row.lessonId)?.hash !== row.sourceHash).map(row => row.lessonId);
  const allSourcePins = Object.fromEntries(result.inputs.packs.map(row => [row.lessonId, row.sourceHash]));
  const pinsPath = join(outputRoot, "source-pins.json");
  if (existsSync(pinsPath)) assert.deepEqual(readJson(pinsPath), allSourcePins, "Editorial source changed after pinning; halt and audit");
  else writeJson(pinsPath, allSourcePins);
  const stageRoot = join(outputRoot, stage);
  const packPath = join(stageRoot, "science.pack.json");
  if (existsSync(packPath)) assert.equal(hashCanonicalJson(readJson(packPath)), hashCanonicalJson(result.pack), "Snapshot changed; use new version instead of overwriting an immutable candidate");
  else { mkdirSync(stageRoot, { recursive: true }); writeFileSync(packPath, `${JSON.stringify(result.pack)}\n`, "utf8"); }
  const fidelityPath = join(stageRoot, "editorial-sidecar.json");
  const sidecar = { sourcePins: Object.fromEntries(result.selected.map(row => [row.lessonId, row.sourceHash])), sourcePacks: result.selected.map(row => row.pack), sourceLibrary: result.inputs.library, conceptMap: result.inputs.conceptMap.entries.filter(entry => selected.some(id => entry.editorialId.startsWith(`${id}-`))), media, ...(stage === "media" ? { runtimeMediaLessonVersions: Object.fromEntries(result.pack.track.modules.flatMap(module => module.lessons).filter(lesson => lesson.version === 3).map(lesson => [lesson.id, lesson.version])) } : {}), integrationDefaults: { estimatedMinutes: 30, provenanceType: "generated", cognitiveOperations: { UNDERSTAND: "interpret", TRANSFER: "apply" }, curriculumCrosswalkUnverified: true } };
  if (existsSync(fidelityPath)) assert.equal(hashCanonicalJson(readJson(fidelityPath)), hashCanonicalJson(sidecar)); else writeJson(fidelityPath, sidecar);
  const report = { stage, lessons: selected.length, questions: result.pack.questions.length, concepts: result.pack.track.modules.flatMap(module => module.lessons.flatMap(lesson => lesson.concepts)).length, sourceVersion: 2, snapshotVersion: result.pack.version, contentHash: result.contentHash, byteLength: result.byteLength, draftsOnly: true, staleManifestHashes, embeddedMedia: media.assets.length, missingMediaFallbacks: result.pack.track.modules.flatMap(module => module.lessons.flatMap(lesson => lesson.blocks)).filter(block => ["IMAGE_REQUEST", "DETERMINISTIC_COMPONENT_REQUEST"].includes(String((block.payload.editorial as { type: string }).type)) && block.type !== "figure").length, importPerformed: false, publicationPerformed: false };
  if (command === "import" || command === "validate") {
    const databasePath = resolve(root, argument("--db", ".local/science-integration/db"));
    assert(databasePath.startsWith(`${outputRoot}\\`) || databasePath.startsWith(`${outputRoot}/`), "Only owned .local/science-integration persistent development database is allowed");
    const client = new PGlite(databasePath);
    await client.waitReady;
    try {
      const migrationFiles = readdirSync(resolve(root, "src/db/migrations")).filter(file => file.endsWith(".sql")).sort();
      const migrationHash = sha256(migrationFiles.map(file => `${file}:${sha256(readFileSync(resolve(root, "src/db/migrations", file)))}`).join("\n"));
      const existingSchema = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_name='pack_imports'");
      const receiptPath = `${databasePath}.migrations.json`;
      if (!existingSchema.rows[0].count) {
        assert.equal(command, "import", "Database has no imported content; run import first");
        await client.exec("BEGIN");
        try { for (const file of migrationFiles) for (const statement of readFileSync(resolve(root, "src/db/migrations", file), "utf8").split("--> statement-breakpoint")) if (statement.trim()) await client.exec(statement); await client.exec("COMMIT"); }
        catch (error) { await client.exec("ROLLBACK"); throw error; }
        writeJson(receiptPath, { migrationHash });
      } else assert.equal((readJson(receiptPath) as { migrationHash: string }).migrationHash, migrationHash, "Development schema drift requires explicit migration audit");
      const db = drizzle(client, { schema });
      const repository = new DrizzleTrackImportRepository(db, "science-local-integration");
      const baselinePaths = ["packs/releases/ifsc-week-1.pack.json", ".local/mathematics-production/application/mathematics.pack.json"].filter(path => existsSync(resolve(root, path)));
      const beforeState = await client.query("SELECT (SELECT count(*)::int FROM attempts) AS attempts, (SELECT count(*)::int FROM study_events) AS study_events, (SELECT count(*)::int FROM concept_evidence) AS concept_evidence");
      let preservationBefore: Awaited<ReturnType<typeof capturePreservationSnapshot>>;
      if (command === "import") {
        for (const path of baselinePaths) { const baseline = await importTrackPack(readJson(resolve(root, path)), repository); assert(["imported", "already_imported"].includes(baseline.status), `Baseline import failed: ${JSON.stringify(baseline).slice(0, 500)}`); }
        preservationBefore = await capturePreservationSnapshot(client);
        const imported = await importTrackPack(result.pack, repository); assert(["imported", "already_imported"].includes(imported.status), JSON.stringify(imported));
        assert.equal((await importTrackPack(result.pack, repository)).status, "already_imported");
      } else preservationBefore = await capturePreservationSnapshot(client);
      const imported = await repository.findPackImport(result.pack.packId, result.pack.version); assert.equal(imported?.contentHash, result.contentHash, "Expected exact source-bound import");
      const lessons = await client.query<{ stable_id: string; status: string }>("SELECT l.stable_id, l.metadata->>'status' AS status FROM lessons l JOIN modules m ON m.id=l.module_id JOIN tracks t ON t.id=m.track_id WHERE t.stable_id='ifsc-2027-science' AND t.content_version=$1", [result.pack.version]);
      assert.equal(lessons.rows.length, selected.length); assert(lessons.rows.every(row => row.status === "draft"));
      const afterState = await client.query("SELECT (SELECT count(*)::int FROM attempts) AS attempts, (SELECT count(*)::int FROM study_events) AS study_events, (SELECT count(*)::int FROM concept_evidence) AS concept_evidence");
      assert.deepEqual(afterState.rows, beforeState.rows, "Content import touched immutable student state");
      const preservation = assertPreservation(preservationBefore, await capturePreservationSnapshot(client));
      const preservationPath = join(stageRoot, "preservation-audit.json");
      if (existsSync(preservationPath)) assert.equal((readJson(preservationPath) as { afterHash: string }).afterHash, preservation.afterHash, "Existing baseline drifted after sealed import");
      writeJson(preservationPath, preservation);
      writeJson(join(stageRoot, "import-receipt.json"), { ...report, importPerformed: true, persistentDevelopmentDatabase: databasePath, idempotenceVerified: true, baselinePaths, studentStateUnchanged: true });
      report.importPerformed = true;
    } finally { await client.close(); }
  }
  writeJson(join(stageRoot, "preflight.json"), report);
  console.log(JSON.stringify({ ...report, staleManifestHashes: staleManifestHashes.length, output: stageRoot }));
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
