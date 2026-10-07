import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";
import { activities, conceptEvidence, concepts, conceptPrerequisites, contentPublicationEvents, contentQaReviews, contentReleases, curriculumRequirements, curriculumRequirementConcepts, lessonConcepts, lessons, mistakes, modules, packImports, reviewSchedules, studySessions, trackConceptSettings, tracks } from "@/db/schema";
import { QuestionStudyRepository } from "./question-study-repository";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { calculateVersionedMastery } from "@/features/mastery/mastery-policy-v2";
import { derivePublicationDetails } from "@/features/content-qa/publication-details";
import { adaptiveChoice, type AdaptiveActivity } from "@/features/study-sessions/adaptive-candidates";
import { examPhase } from "@/features/study-sessions/planner-policy";
import { planningActivityKey } from "@/features/study-sessions/frozen-membership";
import { sessionItemsSchema } from "@/features/study-sessions/contracts";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export async function sqlAdaptiveChoices(db: Database, ownerId: string, budget: number, limits: Readonly<Record<string, number>> | undefined, now: Date) {
  const rows = await db.select({ lesson: lessons, subject: modules.subjectCode, trackId: tracks.id, trackStableId: tracks.stableId, packImportId: tracks.packImportId }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).innerJoin(tracks, eq(tracks.id, modules.trackId)).where(sql`${lessons.metadata}->>'status' = 'published' AND ${lessons.metadata}->>'qaReleaseId' IS NOT NULL`).orderBy(desc(lessons.contentVersion), desc(tracks.contentVersion), lessons.orderIndex);
  const seen = new Set<string>();
  const candidates = rows.filter(row => { const key = JSON.stringify([row.trackStableId, row.lesson.stableId]); if (seen.has(key)) return false; seen.add(key); return true; });
  if (!candidates.length) return { choices: [], subjectMinutes: {} as Record<string, number> };
  const [activityRows, facts, links, edges, settings, reviews, errors, history, manifests, conceptRows, releases, qa, publications, validatedMappings] = await Promise.all([
    db.select().from(activities).where(and(inArray(activities.lessonId, candidates.map(row => row.lesson.id)), eq(activities.type, "question"))),
    db.select().from(conceptEvidence).where(eq(conceptEvidence.ownerId, ownerId)), db.select().from(lessonConcepts), db.select().from(conceptPrerequisites), db.select().from(trackConceptSettings),
    db.select().from(reviewSchedules).where(eq(reviewSchedules.ownerId, ownerId)), db.select().from(mistakes).where(and(eq(mistakes.ownerId, ownerId), eq(mistakes.status, "active"))),
    db.select().from(studySessions).where(and(eq(studySessions.ownerId, ownerId), eq(studySessions.status, "COMPLETED"))), db.select().from(packImports), db.select().from(concepts),
    db.select().from(contentReleases).where(eq(contentReleases.targetType, "lesson")), db.select().from(contentQaReviews), db.select().from(contentPublicationEvents),
    db.select({ conceptId: curriculumRequirementConcepts.conceptId, trackId: curriculumRequirementConcepts.trackId, requirementId: curriculumRequirements.stableId }).from(curriculumRequirementConcepts).innerJoin(curriculumRequirements, eq(curriculumRequirements.id, curriculumRequirementConcepts.requirementId))
  ]);
  const refs = activityRows.flatMap(activity => { const config = questionReferenceSchema.safeParse(activity.config), lesson = candidates.find(row => row.lesson.id === activity.lessonId); return config.success && lesson ? [{ trackId: lesson.trackId, lessonId: lesson.lesson.stableId, lessonVersion: lesson.lesson.contentVersion, activityId: activity.stableId, questionId: config.data.questionId, questionVersion: config.data.questionVersion }] : []; });
  const available = await new QuestionStudyRepository(db).planningAvailability(ownerId, refs, now);
  const masteryById = new Map(conceptRows.map(concept => [concept.id, calculateVersionedMastery(facts.filter(fact => fact.conceptId === concept.id).map(fact => ({ ...fact, conceptStableId: concept.stableId, conditions: fact.conditions as Record<string, unknown> })), now)]));
  const stableToId = new Map(conceptRows.map(concept => [concept.stableId, concept.id]));
  const subjectMinutes: Record<string, number> = Object.create(null);
  for (const session of history) if (session.endedAt && session.endedAt.getTime() >= now.getTime() - 7 * 86400_000) for (const item of sessionItemsSchema.parse(session.items)) subjectMinutes[item.subjectCode] = (subjectMinutes[item.subjectCode] ?? 0) + item.minutes;
  const choices: NonNullable<ReturnType<typeof adaptiveChoice>>[] = [];
  for (const row of candidates) {
    const metadata = row.lesson.metadata as { objectives?: string[]; sourceIds?: string[]; exitTicketQuestionIds?: string[]; estimatedMinutes?: number; prerequisiteConceptIds?: string[]; qaReleaseId?: string };
    const ids = links.filter(link => link.lessonId === row.lesson.id).map(link => link.conceptId);
    const conceptIds = conceptRows.filter(concept => ids.includes(concept.id)).map(concept => concept.stableId);
    const due = reviews.filter(review => ids.includes(review.conceptId) && review.nextReviewAt <= now);
    const required = edges.filter(edge => edge.trackId === row.trackId && ids.includes(edge.conceptId) && edge.strength === "required" && !ids.includes(edge.prerequisiteConceptId));
    const prerequisitesReady = required.every(edge => (masteryById.get(edge.prerequisiteConceptId)?.level ?? 0) >= 2) && (metadata.prerequisiteConceptIds ?? []).every(id => (masteryById.get(stableToId.get(id) ?? "")?.level ?? 0) >= 2);
    const eligible: AdaptiveActivity[] = activityRows.filter(activity => activity.lessonId === row.lesson.id).flatMap(activity => {
      const version = available.get(planningActivityKey(row.trackId, row.lesson.stableId, row.lesson.contentVersion, activity.stableId)); if (!version) return [];
      const conditions = facts.filter(fact => (fact.conditions as Record<string, unknown>).questionId === version.question.id && (fact.conditions as Record<string, unknown>).questionVersion === version.question.version).map(fact => fact.conditions as Record<string, unknown>);
      return [{ stableId: activity.stableId, prompt: activity.prompt, orderIndex: activity.orderIndex, config: questionReferenceSchema.parse(activity.config), question: version.question,
        independentSuccess: conditions.some(condition => condition.outcome === "passed" && condition.hintLevel === 0 && condition.solutionRevealed === false), failedBefore: conditions.some(condition => condition.outcome === "failed") }];
    });
    const release = releases.find(release => release.id === metadata.qaReleaseId && release.stableId === row.lesson.stableId && release.version === row.lesson.contentVersion);
    const publication = release ? derivePublicationDetails(release, publications.filter(event => event.releaseId === release.id), qa.filter(review => review.releaseId === release.id)) : null;
    const manifest = manifests.find(pack => pack.id === row.packImportId)?.manifest as { curriculumRequirements?: { id: string; status?: string }[]; track?: { metadata?: { examDate?: string; sourceScopeVerified?: boolean } } } | undefined;
    const date = manifest?.track?.metadata?.examDate;
    const importance = Math.max(1, ...settings.filter(setting => setting.trackId === row.trackId && ids.includes(setting.conceptId)).map(setting => ({ low: 1, medium: 2, high: 3, critical: 4 }[setting.importance as "low"] ?? 1)));
    const choice = adaptiveChoice({ id: row.lesson.stableId, trackId: row.trackId, version: row.lesson.contentVersion, title: row.lesson.title, subjectCode: row.subject ?? "", estimatedMinutes: metadata.estimatedMinutes ?? 30,
      conceptIds, levels: ids.map(id => masteryById.get(id)?.level ?? 0), importance, due: due.length > 0, dueDays: Math.max(0, ...due.map(review => (now.getTime() - review.nextReviewAt.getTime()) / 86400_000)),
      mistake: errors.some(error => ids.includes(error.conceptId)), prerequisitesReady, phase: date && Number.isFinite(Date.parse(date)) ? examPhase(now, new Date(date)) : "FOUNDATION",
      objectives: metadata.objectives ?? [], sourceIds: metadata.sourceIds ?? [], checkpointIds: metadata.exitTicketQuestionIds ?? [], independentQa: publication?.published === true && publication.independentQaRecorded,
      officialMappingVerified: manifest?.track?.metadata?.sourceScopeVerified === true && ids.length > 0 && ids.every(id => validatedMappings.some(mapping => mapping.trackId === row.trackId && mapping.conceptId === id && manifest.curriculumRequirements?.some(requirement => requirement.id === mapping.requirementId && requirement.status === "validated"))), activities: eligible }, budget, limits ? limits[row.subject ?? ""] ?? 0 : budget);
    if (choice) choices.push(choice);
  }
  return { choices, subjectMinutes };
}
