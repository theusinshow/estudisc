import assert from "node:assert/strict";
import type { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { jsonFile } from "./adapted-pack-audit";

function normalized(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(normalized).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => `${JSON.stringify(key)}:${normalized(nested)}`).join(",")}}`;
  return JSON.stringify(value);
}
const hash = (value: unknown) => createHash("sha256").update(normalized(value)).digest("hex");
export async function capturePreservationSnapshot(client: PGlite, options?: { packId: string; trackId: string; questionPattern: string; reusedIds: string[] }) {
  const reused = options ? [...options.reusedIds].sort() : (jsonFile(".vecta-agent-context/CONCEPT-MAP.json").entries as { canonicalId: string; disposition: string }[]).filter(entry => entry.disposition === "existing").map(entry => entry.canonicalId).sort();
  const queries = {
    packImports: "SELECT schema,pack_id,version,content_hash,status,manifest FROM pack_imports WHERE pack_id <> 'vecta.ifsc-2027.science.local-v2' ORDER BY pack_id,version",
    tracks: "SELECT stable_id,title,description,content_version FROM tracks WHERE stable_id <> 'ifsc-2027-science' ORDER BY stable_id,content_version",
    lessons: "SELECT t.stable_id AS track,m.stable_id AS module,l.stable_id,l.title,l.metadata,l.content_version,l.order_index FROM lessons l JOIN modules m ON m.id=l.module_id JOIN tracks t ON t.id=m.track_id WHERE t.stable_id <> 'ifsc-2027-science' ORDER BY t.stable_id,m.stable_id,l.stable_id,l.content_version",
    blocks: "SELECT t.stable_id AS track,l.stable_id AS lesson,l.content_version,b.stable_id,b.type,b.order_index,b.payload FROM content_blocks b JOIN lessons l ON l.id=b.lesson_id JOIN modules m ON m.id=l.module_id JOIN tracks t ON t.id=m.track_id WHERE t.stable_id <> 'ifsc-2027-science' ORDER BY t.stable_id,l.stable_id,l.content_version,b.order_index,b.stable_id",
    activities: "SELECT t.stable_id AS track,l.stable_id AS lesson,l.content_version,a.stable_id,a.type,a.order_index,a.prompt,a.config,a.evaluator_version FROM activities a JOIN lessons l ON l.id=a.lesson_id JOIN modules m ON m.id=l.module_id JOIN tracks t ON t.id=m.track_id WHERE t.stable_id <> 'ifsc-2027-science' ORDER BY t.stable_id,l.stable_id,l.content_version,a.order_index,a.stable_id",
    questions: "SELECT q.stable_id,v.version,v.subject_code,v.type,v.difficulty,v.status,v.content_hash,v.content FROM question_versions v JOIN questions q ON q.id=v.question_id WHERE q.stable_id !~ '^CIE-[0-9]{2}-Q[0-9]{3}$' ORDER BY q.stable_id,v.version"
  };
  const sections: Record<string, { count: number; hash: string }> = {};
  for (const [name, sql] of Object.entries(queries)) {
    const query = options ? sql.replaceAll("'vecta.ifsc-2027.science.local-v2'", "$1").replaceAll("'ifsc-2027-science'", "$1").replaceAll("'^CIE-[0-9]{2}-Q[0-9]{3}$'", "$1") : sql;
    const parameter = name === "packImports" ? options?.packId : name === "questions" ? options?.questionPattern : options?.trackId;
    const result = await client.query(query, options ? [parameter] : []);
    sections[name] = { count: result.rows.length, hash: hash(result.rows) };
  }
  const shared = await client.query<{ stable_id: string; title: string; summary: string | null }>("SELECT stable_id,title,summary FROM concepts WHERE stable_id=ANY($1::text[]) ORDER BY stable_id", [reused]);
  assert.deepEqual(shared.rows.map(row => row.stable_id).sort(), reused, "Reused canonical Concepts must exist before Science import");
  sections.sharedConcepts = { count: shared.rows.length, hash: hash(shared.rows) };
  return { sections, sharedConceptDefinitions: shared.rows, normalizedSnapshotHash: hash(sections) };
}
export function assertPreservation(before: Awaited<ReturnType<typeof capturePreservationSnapshot>>, after: Awaited<ReturnType<typeof capturePreservationSnapshot>>) {
  assert.deepEqual(after, before, "Science import changed existing baseline tracks/lessons/blocks/activities/questions or reused canonical Concept definitions");
  return { unchanged: true, beforeHash: before.normalizedSnapshotHash, afterHash: after.normalizedSnapshotHash, sections: before.sections, sharedConceptDefinitions: before.sharedConceptDefinitions };
}
