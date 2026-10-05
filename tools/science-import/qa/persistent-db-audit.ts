import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { jsonFile, verifySourceUnchanged } from "./adapted-pack-audit";
import { capturePreservationSnapshot } from "./preservation-audit";

async function main() {
assert(process.argv.includes("--worker-closed"), "Run only after root confirms Worker database connection closed; pass --worker-closed then.");
const directory = resolve(".local/science-integration/db");
assert(existsSync(directory), "Existing owned Science development database required; no database created by QA.");
const client = new PGlite(directory);
try {
  await client.exec("BEGIN READ ONLY");
  const pack = jsonFile(".local/science-integration/media/science.pack.json");
  const snapshots = await client.query<{ id: string; content_version: number }>("SELECT id,content_version FROM tracks WHERE stable_id='ifsc-2027-science' ORDER BY content_version DESC");
  assert.equal(snapshots.rows.length, 7, "All seven cumulative Science snapshots must exist");
  const latest = snapshots.rows[0];
  assert.equal(latest.content_version, 7);
  const lessons = await client.query<{ id: string; stable_id: string; metadata: { status: string }; content_version: number }>("SELECT l.id,l.stable_id,l.metadata,l.content_version FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1 ORDER BY l.stable_id", [latest.id]);
  assert.equal(lessons.rows.length, 40);
  assert.equal(new Set(lessons.rows.map(row => row.stable_id)).size, 40);
  assert(lessons.rows.every(row => row.metadata.status === "draft"));
  assert.equal(lessons.rows.filter(row => row.content_version === 3).length, 13);
  assert.equal(lessons.rows.filter(row => row.content_version === 2).length, 27);
  const mediaVersions = pack.track.metadata.scienceIntegration.runtimeMediaLessonVersions as Record<string, number>;
  for (const lesson of lessons.rows) assert.equal(lesson.content_version, mediaVersions[lesson.stable_id] ?? 2);
  const historicalTrack = snapshots.rows.find(row => row.content_version === 6);
  assert(historicalTrack);
  const historicalLessons = await client.query<{ stable_id: string; content_version: number }>("SELECT l.stable_id,l.content_version FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1 ORDER BY l.stable_id", [historicalTrack.id]);
  assert.equal(historicalLessons.rows.length, 40);
  assert(historicalLessons.rows.every(row => row.content_version === 2), "Historical runtime lesson v2 must remain intact");
  const historicalBlocks = await client.query<{ stable_id: string; type: string; payload: { payload: unknown } }>("SELECT b.stable_id,b.type,b.payload FROM content_blocks b JOIN lessons l ON l.id=b.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1 ORDER BY b.stable_id", [historicalTrack.id]);
  const historicalPack = jsonFile(".local/science-integration/batch5/science.pack.json");
  const expectedHistoricalBlocks = historicalPack.track.modules.flatMap((module: { lessons: { blocks: { id: string; type: string; payload: unknown }[] }[] }) => module.lessons.flatMap(lesson => lesson.blocks));
  assert.equal(historicalBlocks.rows.length, 538);
  assert.equal(historicalBlocks.rows.filter(row => row.type === "figure").length, 0);
  for (const block of historicalBlocks.rows) {
    const original = expectedHistoricalBlocks.find((candidate: { id: string }) => candidate.id === block.stable_id);
    assert(original);
    assert.equal(block.type, original.type);
    assert.deepEqual(block.payload.payload, original.payload, `Historical v2 block changed ${block.stable_id}`);
  }
  const activities = await client.query<{ stable_id: string; config: { questionId: string; questionVersion: number; conceptIds: string[] }; question_stable_id: string; version: number; status: string }>("SELECT a.stable_id,a.config,q.stable_id AS question_stable_id,v.version,v.status FROM activities a JOIN lessons l ON l.id=a.lesson_id JOIN modules m ON m.id=l.module_id LEFT JOIN questions q ON q.stable_id=a.config->>'questionId' LEFT JOIN question_versions v ON v.question_id=q.id AND v.version=(a.config->>'questionVersion')::int WHERE m.track_id=$1 ORDER BY a.stable_id", [latest.id]);
  assert.equal(activities.rows.length, 320);
  assert.equal(new Set(activities.rows.map(row => row.question_stable_id)).size, 320);
  for (const activity of activities.rows) {
    assert.equal(activity.question_stable_id, activity.config.questionId, `Orphan activity ${activity.stable_id}`);
    assert.equal(activity.version, 2);
    assert.equal(activity.status, "draft");
    const question = pack.questions.find((row: { id: string }) => row.id === activity.question_stable_id);
    assert(question);
    assert.deepEqual(activity.config.conceptIds, question.conceptIds);
  }
  const concepts = await client.query<{ stable_id: string; lesson: string }>("SELECT c.stable_id,l.stable_id AS lesson FROM lesson_concepts lc JOIN concepts c ON c.id=lc.concept_id JOIN lessons l ON l.id=lc.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1 ORDER BY c.stable_id", [latest.id]);
  assert.equal(concepts.rows.length, 240);
  assert.equal(new Set(concepts.rows.map(row => row.stable_id)).size, 240);
  const expectedConceptLinks = pack.track.modules.flatMap((module: { lessons: { id: string; concepts: { id: string }[] }[] }) => module.lessons.flatMap(lesson => lesson.concepts.map(concept => `${lesson.id}:${concept.id}`))).sort();
  assert.deepEqual(concepts.rows.map(row => `${row.lesson}:${row.stable_id}`).sort(), expectedConceptLinks);
  const blocks = await client.query<{ type: string; payload: { editorial?: { type: string } } }>("SELECT b.type,b.payload FROM content_blocks b JOIN lessons l ON l.id=b.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.track_id=$1", [latest.id]);
  assert.equal(blocks.rows.length, 538);
  assert.equal(blocks.rows.filter(row => row.type === "figure").length, 13);
  assert.equal(blocks.rows.filter(row => row.type === "note" && ["IMAGE_REQUEST", "DETERMINISTIC_COMPONENT_REQUEST"].includes(row.payload.editorial?.type ?? "")).length, 24);
  assert.equal(blocks.rows.filter(row => row.type === "note" && row.payload.editorial?.type === "DETERMINISTIC_COMPONENT_REQUEST").length, 11);
  assert.equal(blocks.rows.filter(row => row.type === "note" && row.payload.editorial?.type === "IMAGE_REQUEST").length, 13);
  const questions = await client.query<{ id: string; stable_id: string; version: number; status: string; content: { conceptIds: string[]; primaryConceptId: string } }>("SELECT v.id,q.stable_id,v.version,v.status,v.content FROM question_versions v JOIN questions q ON q.id=v.question_id WHERE q.stable_id ~ '^CIE-[0-9]{2}-Q[0-9]{3}$' ORDER BY q.stable_id,v.version");
  assert.equal(questions.rows.length, 320);
  assert.equal(new Set(questions.rows.map(row => `${row.stable_id}:${row.version}`)).size, 320);
  assert(questions.rows.every(row => row.status === "draft" && row.version === 2));
  for (const question of questions.rows) {
    assert.deepEqual(question.content, pack.questions.find((candidate: { id: string }) => candidate.id === question.stable_id), `Stored Question content changed ${question.stable_id}`);
    const resolved = await client.query<{ stable_id: string; role: string }>("SELECT c.stable_id,qc.role FROM question_concepts qc JOIN concepts c ON c.id=qc.concept_id WHERE qc.question_version_id=$1 ORDER BY c.stable_id", [question.id]);
    assert.deepEqual(resolved.rows.map(row => row.stable_id), [...question.content.conceptIds].sort(), `Orphan/mismatched Question Concepts ${question.stable_id}`);
    assert.deepEqual(resolved.rows.filter(row => row.role === "primary").map(row => row.stable_id), [question.content.primaryConceptId]);
  }
  const duplicateQuestions = await client.query("SELECT question_id,version FROM question_versions GROUP BY question_id,version HAVING count(*)>1");
  assert.equal(duplicateQuestions.rows.length, 0);
  const orphanJoins = await client.query<{ count: number }>("SELECT ((SELECT count(*) FROM question_concepts qc LEFT JOIN question_versions v ON v.id=qc.question_version_id LEFT JOIN concepts c ON c.id=qc.concept_id WHERE v.id IS NULL OR c.id IS NULL)+(SELECT count(*) FROM lesson_concepts lc LEFT JOIN lessons l ON l.id=lc.lesson_id LEFT JOIN concepts c ON c.id=lc.concept_id WHERE l.id IS NULL OR c.id IS NULL))::int AS count");
  assert.equal(orphanJoins.rows[0].count, 0);
  const scienceReleases = await client.query<{ count: number }>("SELECT count(*)::int AS count FROM content_releases WHERE (stable_id='ifsc-2027-science' OR stable_id ~ '^CIE-[0-9]{2}-Q[0-9]{3}$') AND status='published'");
  assert.equal(scienceReleases.rows[0].count, 0);
  const state = await client.query<{ attempts: number; events: number; evidence: number }>("SELECT (SELECT count(*)::int FROM attempts) AS attempts,(SELECT count(*)::int FROM study_events) AS events,(SELECT count(*)::int FROM concept_evidence) AS evidence");
  assert.deepEqual(state.rows[0], { attempts: 0, events: 0, evidence: 0 });
  const preservation = await capturePreservationSnapshot(client);
  const receipt = jsonFile(".local/science-integration/media/preservation-audit.json");
  assert.equal(preservation.normalizedSnapshotHash, receipt.afterHash);
  assert.equal(preservation.sections.questions.count, 380);
  assert.equal(preservation.sections.sharedConcepts.count, 9);
  await client.exec("COMMIT");
  const report = { readOnlyTransaction: true, snapshots: snapshots.rows.length, latestVersion: latest.content_version, lessons: 40, runtimeLessonV3: 13, runtimeLessonV2: 27, historicalV2LessonsPreserved: 40, historicalV2BlocksPreserved: 538, activities: 320, questions: 320, concepts: 240, figures: 13, explicitPendingMediaNotes: 24, pendingDeterministicComponents: 11, pendingImageRequests: 13, blocks: 538, baselineQuestions: 380, totalQuestions: 700, duplicateQuestionVersions: 0, orphanJoins: 0, learnerState: state.rows[0], baselinePreservationHash: preservation.normalizedSnapshotHash, sourceFilesUnchanged: verifySourceUnchanged(), passed: true };
  mkdirSync(".local/science-integration/qa", { recursive: true });
  writeFileSync(".local/science-integration/qa/persistent-db-audit.json", `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
} finally { await client.close(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
