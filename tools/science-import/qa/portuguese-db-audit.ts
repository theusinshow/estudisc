import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { trackPackV2Schema } from "../../../src/features/import/application/track-pack-v2-schema";
import { PORTUGUESE_MAP, PORTUGUESE_PROFILE } from "../portuguese";
import { readJson } from "../mapper";
import { auditPortuguesePack } from "./portuguese-audit";
import { capturePreservationSnapshot } from "./preservation-audit";

async function main() {
  const pack = trackPackV2Schema.parse(readJson(".local/portuguese-integration/batch4/portuguese.pack.json"));
  const fidelity = auditPortuguesePack(pack);
  const client = new PGlite(".local/portuguese-integration/db");
  await client.waitReady;
  try {
    await client.exec("BEGIN TRANSACTION READ ONLY");
    const snapshots = await client.query<{ id: string; content_version: number }>("SELECT id,content_version FROM tracks WHERE stable_id=$1 ORDER BY content_version", [pack.track.id]);
    assert.deepEqual(snapshots.rows.map(row => row.content_version), [2, 3, 4, 5, 6]);
    const latest = snapshots.rows.at(-1)!;
    const lessons = await client.query<{ stable_id: string; content_version: number; status: string }>("SELECT l.stable_id,l.content_version,l.metadata->>'status' AS status FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1 ORDER BY l.stable_id", [latest.id]);
    assert.equal(lessons.rows.length, 24);
    assert.equal(new Set(lessons.rows.map(row => row.stable_id)).size, 24);
    assert(lessons.rows.every(row => row.content_version === 2 && row.status === "draft"));
    const blocks = await client.query<{ stable_id: string; type: string; payload: { payload: unknown } }>("SELECT b.stable_id,b.type,b.payload FROM content_blocks b JOIN lessons l ON l.id=b.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1 ORDER BY b.stable_id", [latest.id]);
    const expectedBlocks = pack.track.modules.flatMap(module => module.lessons.flatMap(lesson => lesson.blocks));
    assert.equal(blocks.rows.length, 264);
    for (const block of blocks.rows) {
      const original = expectedBlocks.find(row => row.id === block.stable_id); assert(original);
      assert.equal(block.type, original.type); assert.deepEqual(block.payload.payload, original.payload);
    }
    const counts = await client.query<{ concepts: number; activities: number }>("SELECT (SELECT count(*)::int FROM lesson_concepts lc JOIN lessons l ON l.id=lc.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1) AS concepts,(SELECT count(*)::int FROM activities a JOIN lessons l ON l.id=a.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1) AS activities", [latest.id]);
    assert.deepEqual(counts.rows[0], { concepts: 144, activities: 192 });
    const questions = await client.query<{ id: string; stable_id: string; version: number; status: string; content: unknown }>("SELECT v.id,q.stable_id,v.version,v.status,v.content FROM question_versions v JOIN questions q ON q.id=v.question_id WHERE q.stable_id ~ '^POR-[0-9]{2}-Q[0-9]{2}$' ORDER BY q.stable_id,v.version");
    assert.equal(questions.rows.length, 192);
    assert.equal(new Set(questions.rows.map(row => `${row.stable_id}:${row.version}`)).size, 192);
    assert(questions.rows.every(row => row.version === 1 && row.status === "draft"));
    for (const question of questions.rows) {
      const original = pack.questions.find(row => row.id === question.stable_id); assert(original);
      assert.deepEqual(question.content, original);
      const links = await client.query<{ stable_id: string }>("SELECT c.stable_id FROM question_concepts qc JOIN concepts c ON c.id=qc.concept_id WHERE qc.question_version_id=$1 ORDER BY c.stable_id", [question.id]);
      assert.deepEqual(links.rows.map(row => row.stable_id), [...original.conceptIds].sort());
    }
    const orphans = await client.query<{ count: number }>("SELECT ((SELECT count(*) FROM lesson_concepts lc LEFT JOIN lessons l ON l.id=lc.lesson_id LEFT JOIN concepts c ON c.id=lc.concept_id WHERE l.id IS NULL OR c.id IS NULL)+(SELECT count(*) FROM question_concepts qc LEFT JOIN question_versions qv ON qv.id=qc.question_version_id LEFT JOIN concepts c ON c.id=qc.concept_id WHERE qv.id IS NULL OR c.id IS NULL))::int AS count");
    assert.equal(orphans.rows[0].count, 0);
    const releases = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM content_releases WHERE (stable_id=$1 OR stable_id ~ '^POR-[0-9]{2}(-Q[0-9]{2})?$') AND status='published'", [pack.track.id]);
    assert.equal(releases.rows[0].count, 0);
    const state = await client.query<{ attempts: number; events: number; evidence: number }>("SELECT (SELECT count(*)::int FROM attempts) AS attempts,(SELECT count(*)::int FROM study_events) AS events,(SELECT count(*)::int FROM concept_evidence) AS evidence");
    assert.deepEqual(state.rows[0], { attempts: 0, events: 0, evidence: 0 });
    const preservation = await capturePreservationSnapshot(client, { packId: PORTUGUESE_PROFILE.packId, trackId: pack.track.id, questionPrefix: "POR", conceptMapPath: PORTUGUESE_MAP });
    const receipt = readJson(".local/portuguese-integration/batch4/preservation-audit.json") as { afterHash: string };
    assert.equal(preservation.normalizedSnapshotHash, receipt.afterHash);
    assert.equal(preservation.sections.questions.count, 700);
    await client.exec("COMMIT");
    const report = { ...fidelity, passed: true, readOnlyTransaction: true, snapshots: 5, runtimeLessonVersion: 2, runtimeQuestionVersion: 1, baselineQuestions: 700, totalQuestions: 892, orphanJoins: 0, duplicateQuestionVersions: 0, studentState: state.rows[0], baselinePreservationHash: preservation.normalizedSnapshotHash };
    mkdirSync(".local/portuguese-integration/qa", { recursive: true });
    writeFileSync(".local/portuguese-integration/qa/persistent-db-audit.json", `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report));
  } finally { await client.close(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
