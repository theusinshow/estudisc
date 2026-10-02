// Builds the importable Week 1 pack: the Golden seed plus the reviewed Week 1 drafts, all still "draft".
// Publication happens only through the per-lesson review in /admin/review (ADR 0033).
// The committed copy at packs/releases/ifsc-week-1.pack.json is what /import's one-click button imports;
// tests/unit/ifsc-week-pack.test.ts fails when it drifts from the sources.
// Usage: node scripts/build-ifsc-week-pack.mjs [output.json]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DRAFT_SOURCE, expandLessonDraft, loadLessonDrafts } from "./expand-ifsc-lesson-drafts.mjs";

export const WEEK_1 = ["MAT-01", "MAT-02", "POR-02", "CIE-01", "CIE-02", "GH-01", "GH-02"];
export const WEEK_PACK_PATH = "packs/releases/ifsc-week-1.pack.json";

export function buildWeekPack() {
  const pack = JSON.parse(readFileSync("packs/seeds/ifsc-2027.golden.track.v2.json", "utf8"));
  const drafts = loadLessonDrafts().filter(draft => WEEK_1.includes(draft.id)).map(expandLessonDraft);
  if (drafts.length !== WEEK_1.length) throw new Error(`Expected ${WEEK_1.length} Week 1 drafts, found ${drafts.length}`);
  pack.packId = "know-os.ifsc-2027.week-1";
  pack.sources.push(DRAFT_SOURCE);
  pack.questions.push(...drafts.flatMap(draft => draft.questions));
  for (const { lesson } of drafts) pack.track.modules.find(entry => entry.subjectCode === lesson.id.split("-")[0]).lessons.push(lesson);
  return pack;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = process.argv[2] ?? WEEK_PACK_PATH;
  const pack = buildWeekPack();
  const json = `${JSON.stringify(pack)}\n`;
  writeFileSync(output, json);
  console.log(`Week 1 pack: ${pack.track.modules.flatMap(entry => entry.lessons).length} lessons, ${pack.questions.length} questions, ${(Buffer.byteLength(json) / 1024).toFixed(0)} kB -> ${output}`);
}
