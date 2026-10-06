import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { trackPackV2Schema } from "../../../src/features/import/application/track-pack-v2-schema";
import { GH_MAP, GH_PROFILE } from "../history-geography";
import { readJson } from "../mapper";
import { auditGhPack } from "./history-geography-audit";
import { capturePreservationSnapshot } from "./preservation-audit";

async function main() {
  const pack = trackPackV2Schema.parse(readJson(".local/history-geography-integration/batch6/history-geography.pack.json"));
  const fidelity = auditGhPack(pack);
  const client = new PGlite(".local/history-geography-integration/db");
  await client.waitReady;
  try {
    await client.exec("BEGIN TRANSACTION READ ONLY");
    const snapshots = await client.query<{ id: string; content_version: number }>("SELECT id,content_version FROM tracks WHERE stable_id=$1 ORDER BY content_version", [pack.track.id]);
    assert.deepEqual(snapshots.rows.map(row => row.content_version), [1, 2, 3, 4, 5, 6, 7]);
    const latest = snapshots.rows.at(-1)!;
    const lessons = await client.query<{ stable_id: string; content_version: number; status: string }>("SELECT l.stable_id,l.content_version,l.metadata->>'status' AS status FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1 ORDER BY l.stable_id", [latest.id]);
    assert.equal(lessons.rows.length, 49); assert.equal(new Set(lessons.rows.map(row => row.stable_id)).size, 49);
    assert(lessons.rows.every(row => row.content_version === 2 && row.status === "draft"));
    const blocks = await client.query<{ stable_id: string; type: string; payload: { payload: unknown } }>("SELECT b.stable_id,b.type,b.payload FROM content_blocks b JOIN lessons l ON l.id=b.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1 ORDER BY b.stable_id", [latest.id]);
    const expectedBlocks = pack.track.modules.flatMap(module => module.lessons.flatMap(lesson => lesson.blocks));
    assert.equal(blocks.rows.length, 670);
    for (const block of blocks.rows) {
      const expected = expectedBlocks.find(row => row.id === block.stable_id); assert(expected);
      assert.equal(block.type, expected.type); assert.deepEqual(block.payload.payload, expected.payload);
    }
    const counts = await client.query<{ concepts: number; activities: number }>("SELECT (SELECT count(*)::int FROM lesson_concepts lc JOIN lessons l ON l.id=lc.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1) AS concepts,(SELECT count(*)::int FROM activities a JOIN lessons l ON l.id=a.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1) AS activities", [latest.id]);
    assert.deepEqual(counts.rows[0], { concepts: 293, activities: 392 });
    const questions = await client.query<{ id: string; stable_id: string; version: number; status: string; content: unknown }>("SELECT v.id,q.stable_id,v.version,v.status,v.content FROM question_versions v JOIN questions q ON q.id=v.question_id WHERE q.stable_id ~ '^GH-[0-9]{2}-Q[0-9]{3}$' ORDER BY q.stable_id,v.version");
    assert.equal(questions.rows.length, 392); assert.equal(new Set(questions.rows.map(row => `${row.stable_id}:${row.version}`)).size, 392);
    assert(questions.rows.every(row => row.version === 2 && row.status === "draft"));
    for (const question of questions.rows) {
      const expected = pack.questions.find(row => row.id === question.stable_id); assert(expected);
      assert.deepEqual(question.content, expected);
      const links = await client.query<{ stable_id: string }>("SELECT c.stable_id FROM question_concepts qc JOIN concepts c ON c.id=qc.concept_id WHERE qc.question_version_id=$1 ORDER BY c.stable_id", [question.id]);
      assert.deepEqual(links.rows.map(row => row.stable_id), [...expected.conceptIds].sort());
    }
    const orphans = await client.query<{ count: number }>("SELECT ((SELECT count(*) FROM lesson_concepts lc LEFT JOIN lessons l ON l.id=lc.lesson_id LEFT JOIN concepts c ON c.id=lc.concept_id WHERE l.id IS NULL OR c.id IS NULL)+(SELECT count(*) FROM question_concepts qc LEFT JOIN question_versions qv ON qv.id=qc.question_version_id LEFT JOIN concepts c ON c.id=qc.concept_id WHERE qv.id IS NULL OR c.id IS NULL))::int AS count");
    assert.equal(orphans.rows[0].count, 0);
    const releases = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM content_releases WHERE (stable_id=$1 OR stable_id ~ '^GH-[0-9]{2}(-Q[0-9]{3})?$') AND version>=2 AND status='published'", [pack.track.id]);
    assert.equal(releases.rows[0].count, 0);
    const state = await client.query<{ attempts: number; events: number; evidence: number }>("SELECT (SELECT count(*)::int FROM attempts) AS attempts,(SELECT count(*)::int FROM study_events) AS events,(SELECT count(*)::int FROM concept_evidence) AS evidence");
    assert.deepEqual(state.rows[0], { attempts: 0, events: 0, evidence: 0 });
    const preservation = await capturePreservationSnapshot(client, { packId: GH_PROFILE.packId, trackId: GH_PROFILE.trackId, questionPrefix: "GH", conceptMapPath: GH_MAP });
    const receipt = readJson(".local/history-geography-integration/batch6/preservation-audit.json") as { afterHash: string };
    assert.equal(preservation.normalizedSnapshotHash, receipt.afterHash); assert.equal(preservation.sections.questions.count, 892);
    await client.exec("COMMIT");
    const report = { ...fidelity, passed: true, readOnlyTransaction: true, snapshots: 7, runtimeVersion: 2, baselineQuestions: 892, totalQuestions: 1284, orphanJoins: 0, duplicateQuestionVersions: 0, studentState: state.rows[0], baselinePreservationHash: preservation.normalizedSnapshotHash };
    mkdirSync(".local/history-geography-integration/qa", { recursive: true });
    writeFileSync(".local/history-geography-integration/qa/persistent-db-audit.json", `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report));
  } finally { await client.close(); }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
