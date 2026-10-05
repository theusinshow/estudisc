import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sha256 } from "../science-import/mapper";
import { PACK, ALL, runtimeId } from "./mapper";
import { trackPackV2Schema } from "../../src/features/import/application/track-pack-v2-schema";
import { directPublicationSchema } from "../../src/features/content-qa/direct-publication";

export const REVIEW_REASON = "O responsável informou: Aulas revisadas, pode ja aplicar no software. Publicação autorizada das 49 aulas de Geografia e História e respectivas questões; recursos de mídia continuam sinalizados como pendentes.";
export function reviewedGhRelease() {
  const bytes = readFileSync(PACK);
  assert.equal(sha256(bytes), "a0e6c36d26fbe5e264e5cbe419ef74ee77b940a372b38e69a71c57537f5c6729", "Reviewed GH snapshot changed");
  const pack = trackPackV2Schema.parse(JSON.parse(bytes.toString("utf8")));
  const lessons = pack.track.modules.flatMap(m => m.lessons.map(l => ({ lessonId: l.id, version: l.version })));
  assert.deepEqual(lessons, ALL.map(id => ({ lessonId: runtimeId(id), version: 3 })));
  assert.equal(pack.questions.length, 392);
  return { pack, batches: [lessons.slice(0, 40), lessons.slice(40)].map(targets => ({ action: "publish_lessons_direct" as const, ...directPublicationSchema.parse({ lessons: targets, reason: REVIEW_REASON }) })) };
}
