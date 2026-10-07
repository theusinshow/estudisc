import type { MemoryStore } from "./memory/store";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { canExposeQuestion } from "@/features/questions/exposure";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";
import { adaptiveChoice, type AdaptiveActivity } from "@/features/study-sessions/adaptive-candidates";
import { examPhase } from "@/features/study-sessions/planner-policy";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";

export function memoryAdaptiveChoices(store: MemoryStore, ownerId: string, budget: number, limits: Readonly<Record<string, number>> | undefined, now: Date) {
  const choices: NonNullable<ReturnType<typeof adaptiveChoice>>[] = [];
  const subjectMinutes: Record<string, number> = Object.create(null);
  for (const session of store.studySessions.filter(row => row.ownerId === ownerId && row.status === "COMPLETED" && row.endedAt && row.endedAt.getTime() >= now.getTime() - 7 * 86400_000)) for (const item of sessionItemsSchema.parse(session.items)) subjectMinutes[item.subjectCode] = (subjectMinutes[item.subjectCode] ?? 0) + item.minutes;
  if (store.assessmentInstances.some(instance => instance.ownerId === ownerId && instance.status === "ACTIVE" && instance.snapshot.mode === "EXAM")) return { choices, subjectMinutes };
  const facts = store.conceptEvidence.filter(fact => fact.ownerId === ownerId);
  const mastery = (id: string) => calculateVersionedMastery(facts.filter(fact => fact.conceptStableId === id), now);
  const packs = [...store.packImports].reverse().flatMap(entry => { const parsed = trackPackV2Schema.safeParse(entry.manifest); return parsed.success ? [parsed.data] : []; });
  const canonicalQuestions = new Map(packs.flatMap(pack => pack.questions).reverse().map(question => [JSON.stringify([question.id, question.version]), question]));
  const seen = new Set<string>();
  for (const pack of packs) for (const moduleRecord of pack.track.modules) for (const lesson of [...moduleRecord.lessons].sort((a, b) => b.version - a.version)) {
    const key = JSON.stringify([pack.track.id, lesson.id]); if (lesson.status !== "published" || seen.has(key)) continue; seen.add(key);
    const ids = lesson.concepts.map(concept => concept.id), due = store.reviewSchedules.filter(review => review.ownerId === ownerId && ids.includes(review.conceptStableId) && review.nextReviewAt <= now);
    const required = pack.conceptPrerequisites.filter(edge => ids.includes(edge.conceptId) && edge.strength === "required" && !ids.includes(edge.prerequisiteConceptId));
    const eligible: AdaptiveActivity[] = lesson.activities.flatMap((activity, orderIndex) => {
      if (activity.type !== "question") return [];
      const original = pack.questions.find(question => question.id === activity.questionId);
      const question = original ? canonicalQuestions.get(JSON.stringify([original.id, original.version])) : undefined;
      if (!question || !canExposeQuestion(question, { now, context: "training", exposure: store.questionExposures.find(exposure => exposure.ownerId === ownerId && exposure.questionId === question.id) })) return [];
      const config = questionReferenceSchema.safeParse({ ...activity.config, questionId: question.id, questionVersion: activity.config.questionVersion ?? question.version });
      if (!config.success || config.data.questionVersion !== question.version) return [];
      const conditions = facts.filter(fact => fact.conditions.questionId === question.id && fact.conditions.questionVersion === question.version).map(fact => fact.conditions);
      return [{ stableId: activity.id, prompt: activity.prompt, orderIndex, config: config.data, question,
        independentSuccess: conditions.some(condition => condition.outcome === "passed" && condition.hintLevel === 0 && condition.solutionRevealed === false), failedBefore: conditions.some(condition => condition.outcome === "failed") }];
    });
    const date = pack.track.metadata.examDate;
    const choice = adaptiveChoice({ id: lesson.id, trackId: pack.track.id, version: lesson.version, title: lesson.title, subjectCode: moduleRecord.subjectCode, estimatedMinutes: lesson.estimatedMinutes,
      conceptIds: ids, levels: ids.map(id => mastery(id).level), importance: Math.max(1, ...lesson.concepts.map(concept => ({ low: 1, medium: 2, high: 3, critical: 4 }[concept.importance]))), due: due.length > 0,
      dueDays: Math.max(0, ...due.map(review => (now.getTime() - review.nextReviewAt.getTime()) / 86400_000)), mistake: store.mistakes.some(mistake => mistake.ownerId === ownerId && mistake.status === "active" && ids.includes(mistake.conceptStableId)),
      prerequisitesReady: required.every(edge => mastery(edge.prerequisiteConceptId).level >= 2) && lesson.prerequisiteConceptIds.every(id => mastery(id).level >= 2), phase: typeof date === "string" && Number.isFinite(Date.parse(date)) ? examPhase(now, new Date(date)) : "FOUNDATION",
      objectives: lesson.objectives, sourceIds: lesson.sourceIds, checkpointIds: lesson.exitTicketQuestionIds, independentQa: false, officialMappingVerified: pack.track.metadata.sourceScopeVerified === true && ids.length > 0 && ids.every(id => pack.curriculumRequirements.some(requirement => requirement.status === "validated" && requirement.mappedConceptIds.includes(id))), activities: eligible }, budget, limits ? limits[moduleRecord.subjectCode] ?? 0 : budget);
    if (choice) choices.push(choice);
  }
  return { choices, subjectMinutes };
}
