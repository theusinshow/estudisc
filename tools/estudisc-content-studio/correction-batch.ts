import { hashCanonicalJson } from "@/lib/canonical-json";
import { lessonVersionPackSchema, type LessonVersionPack } from "@/features/import/application/lesson-version-contracts";
import type { TrackPackV2 } from "@/features/import/application/track-pack-v2-schema";

type Lesson = TrackPackV2["track"]["modules"][number]["lessons"][number];
type Block = Lesson["blocks"][number];

export type CorrectionOutcome =
  | { status: "ready"; lessonId: string; pack: LessonVersionPack; replaced: number; removed: number }
  | { status: "unchanged"; lessonId: string }
  | { status: "skipped"; lessonId: string; reason: string };

/**
 * ADR 0062: carry a cleanup made on the source pack (frozen `before` → cleaned `after`) onto the
 * published base version. Only blocks the published base still holds byte-identical to `before`
 * are corrected; enrichment blocks and everything else stay untouched.
 */
export function buildCorrection(input: {
  context: TrackPackV2; moduleId: string; base: Lesson; before: Lesson; after: Lesson;
  packId: string; authorId: string; reason: string;
}): CorrectionOutcome {
  const { context, moduleId, base, before, after } = input;
  const afterById = new Map(after.blocks.map(block => [block.id, block]));
  const changed = before.blocks.filter(block => {
    const next = afterById.get(block.id);
    return !next || hashCanonicalJson(next) !== hashCanonicalJson(block);
  });
  const added = after.blocks.filter(block => !before.blocks.some(old => old.id === block.id));
  if (added.length) return { status: "skipped", lessonId: base.id, reason: `cleanup adds blocks (${added.map(block => block.id).join(", ")}); use an enrichment` };
  if (!changed.length) return { status: "unchanged", lessonId: base.id };

  const changes: NonNullable<LessonVersionPack["corrections"]>["blocks"] = [];
  const blocks: Block[] = [];
  const pending = new Map(changed.map(block => [block.id, block]));
  for (const block of base.blocks) {
    const old = pending.get(block.id);
    if (!old) { blocks.push(block); continue; }
    if (hashCanonicalJson(block) !== hashCanonicalJson(old)) return { status: "skipped", lessonId: base.id, reason: `published block ${block.id} differs from the pre-cleanup source` };
    const next = afterById.get(block.id);
    const baseBlockHash = hashCanonicalJson(block);
    if (next) { blocks.push(next); changes.push({ blockId: block.id, action: "replace", baseBlockHash }); }
    else changes.push({ blockId: block.id, action: "remove", baseBlockHash });
    pending.delete(block.id);
  }
  if (pending.size) return { status: "skipped", lessonId: base.id, reason: `published base lacks ${[...pending.keys()].join(", ")}` };

  const lesson = { ...structuredClone(base), blocks: structuredClone(blocks), version: base.version + 1, status: "draft" as const };
  const questionIds = [...new Set([...base.exitTicketQuestionIds, ...base.activities.flatMap(activity => activity.questionId ? [activity.questionId] : [])])];
  const questionReferences = questionIds.map(id => {
    const question = context.questions.find(entry => entry.id === id);
    if (!question) throw new Error(`Question ${id} missing from the published context`);
    return { id, version: question.version, hash: hashCanonicalJson(question) };
  });
  const pack = lessonVersionPackSchema.parse({
    schema: "caderno.lesson.v2", packId: input.packId, version: 1, authorId: input.authorId,
    target: { trackId: context.track.id, trackVersion: context.version, moduleId, lessonId: base.id, baseVersion: base.version, baseHash: hashCanonicalJson(base) },
    lesson, questionReferences, corrections: { reason: input.reason, blocks: changes }
  });
  return { status: "ready", lessonId: base.id, pack, replaced: changes.filter(change => change.action === "replace").length, removed: changes.filter(change => change.action === "remove").length };
}
