import { hashCanonicalJson } from "@/lib/canonical-json";
import { lessonVersionPackSchema, type LessonVersionPack } from "@/features/import/application/lesson-version-contracts";
import type { TrackPackV2 } from "@/features/import/application/track-pack-v2-schema";

type Lesson = TrackPackV2["track"]["modules"][number]["lessons"][number];
type Block = Lesson["blocks"][number];
type Question = TrackPackV2["questions"][number];

export type CorrectionOutcome =
  | { status: "ready"; lessonId: string; pack: LessonVersionPack; replaced: number; removed: number; questions: number }
  | { status: "unchanged"; lessonId: string }
  | { status: "skipped"; lessonId: string; reason: string };

/** Question content without the fields a new version legitimately changes. */
const questionBody = (question: Question) => hashCanonicalJson({ ...question, version: 0, status: "draft" });

/**
 * Carry a source cleanup onto the published base version as one next version:
 * - blocks (ADR 0062): only blocks the published base still holds byte-identical to `before` are corrected;
 * - Questions (ADR 0063): a lesson Question whose reviewed content differs from the published one becomes
 *   its next version and the lesson's Activities rebind to it.
 * Enrichment blocks and everything else stay untouched.
 */
export function buildCorrection(input: {
  context: TrackPackV2; moduleId: string; base: Lesson; before: Lesson; after: Lesson;
  packId: string; authorId: string; reason: string; reviewedQuestions?: readonly Question[];
}): CorrectionOutcome {
  const { context, moduleId, base, before, after } = input;
  const afterById = new Map(after.blocks.map(block => [block.id, block]));
  const changed = before.blocks.filter(block => {
    const next = afterById.get(block.id);
    return !next || hashCanonicalJson(next) !== hashCanonicalJson(block);
  });
  const added = after.blocks.filter(block => !before.blocks.some(old => old.id === block.id));
  if (added.length) return { status: "skipped", lessonId: base.id, reason: `cleanup adds blocks (${added.map(block => block.id).join(", ")}); use an enrichment` };

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

  const questionIds = [...new Set([...base.exitTicketQuestionIds, ...base.activities.flatMap(activity => activity.questionId ? [activity.questionId] : [])])];
  const published = new Map(questionIds.map(id => {
    const question = context.questions.find(entry => entry.id === id);
    if (!question) throw new Error(`Question ${id} missing from the published context`);
    return [id, question] as const;
  }));
  const updates = new Map<string, Question>();
  for (const reviewed of input.reviewedQuestions ?? []) {
    const current = published.get(reviewed.id);
    if (current && questionBody(reviewed) !== questionBody(current)) updates.set(reviewed.id, { ...structuredClone(reviewed), version: current.version + 1, status: "draft" });
  }
  if (!changes.length && !updates.size) return { status: "unchanged", lessonId: base.id };

  const activities = base.activities.map(activity => {
    const update = activity.questionId ? updates.get(activity.questionId) : undefined;
    return update ? { ...structuredClone(activity), config: { ...activity.config, questionVersion: update.version } } : structuredClone(activity);
  });
  const lesson = { ...structuredClone(base), blocks: structuredClone(blocks), activities, version: base.version + 1, status: "draft" as const };
  const questionReferences = questionIds.map(id => {
    const question = updates.get(id) ?? published.get(id)!;
    return { id, version: question.version, hash: hashCanonicalJson(question) };
  });
  const pack = lessonVersionPackSchema.parse({
    schema: "caderno.lesson.v2", packId: input.packId, version: 1, authorId: input.authorId,
    target: { trackId: context.track.id, trackVersion: context.version, moduleId, lessonId: base.id, baseVersion: base.version, baseHash: hashCanonicalJson(base) },
    lesson, questionReferences,
    ...(changes.length ? { corrections: { reason: input.reason, blocks: changes } } : {}),
    ...(updates.size ? { questionVersions: [...updates.values()] } : {})
  });
  return { status: "ready", lessonId: base.id, pack, replaced: changes.filter(change => change.action === "replace").length, removed: changes.filter(change => change.action === "remove").length, questions: updates.size };
}
