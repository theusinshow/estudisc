import { and, eq, inArray, sql } from "drizzle-orm";
import { activities, concepts, contentReleases, lessons, packImports, questions, questionVersions, trackConceptSettings, tracks } from "@/db/schema";
import { AccessDeniedError, type OwnerProfile } from "@/features/auth/owner";
import { standaloneQuestionSetSchema } from "@/features/questions/standalone-set";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { getDatabase } from "@/db/connection";
import { DrizzleQuestionRepository } from "../question-repository";
import type { ContentDatabase } from "./types";

export class StandaloneQuestionError extends Error {
  constructor(message: string) { super(message); this.name = "StandaloneQuestionError"; }
}

/**
 * A standalone Question (ADR 0065) is referenced by no imported Pack, no lesson activity and no
 * exit ticket. Lesson practice, review and the planner only select Questions through published
 * lesson activities, so these Questions stay unseen until a simulado freezes them.
 */
export async function assertStandaloneQuestions(db: ContentDatabase, ids: readonly string[]) {
  if (!ids.length) return;
  const wanted = new Set(ids);
  const bound = await db.select({ questionId: sql<string>`${activities.config}->>'questionId'` }).from(activities)
    .where(inArray(sql`${activities.config}->>'questionId'`, [...wanted])).limit(1);
  if (bound.length) throw new StandaloneQuestionError(`Question is bound to a lesson activity: ${bound[0].questionId}`);
  for (const row of await db.select({ metadata: lessons.metadata }).from(lessons)) {
    const exit = (row.metadata as { exitTicketQuestionIds?: unknown } | null)?.exitTicketQuestionIds;
    const hit = Array.isArray(exit) ? exit.find(id => typeof id === "string" && wanted.has(id)) : undefined;
    if (hit) throw new StandaloneQuestionError(`Question is a lesson exit ticket: ${hit}`);
  }
  for (const row of await db.select({ manifest: packImports.manifest }).from(packImports)) {
    const list = (row.manifest as { questions?: unknown } | null)?.questions;
    const hit = Array.isArray(list) ? list.find(item => typeof (item as { id?: unknown })?.id === "string" && wanted.has((item as { id: string }).id)) : undefined;
    if (hit) throw new StandaloneQuestionError(`Question belongs to an imported Pack: ${(hit as { id: string }).id}`);
  }
}

export class StandaloneQuestionRepository {
  constructor(private readonly db: ContentDatabase = getDatabase()) {}

  /** Imports draft standalone Questions and registers their immutable content releases. */
  async importSet(actor: OwnerProfile, input: unknown) {
    if (actor.role !== "ADMIN" || !actor.ownerId.trim()) throw new AccessDeniedError();
    const set = standaloneQuestionSetSchema.parse(input);
    return this.db.transaction(async tx => {
      const [track] = await tx.select({ id: tracks.id }).from(tracks).where(eq(tracks.stableId, set.trackId)).limit(1);
      if (!track) throw new StandaloneQuestionError(`Unknown Track: ${set.trackId}`);
      const members = await tx.select({ stableId: concepts.stableId }).from(trackConceptSettings).innerJoin(tracks, eq(tracks.id, trackConceptSettings.trackId)).innerJoin(concepts, eq(concepts.id, trackConceptSettings.conceptId)).where(eq(tracks.stableId, set.trackId));
      const scope = new Set(members.map(row => row.stableId));
      const outside = set.questions.flatMap(question => question.conceptIds).find(id => !scope.has(id));
      if (outside) throw new StandaloneQuestionError(`Concept outside Track ${set.trackId}: ${outside}`);
      await assertStandaloneQuestions(tx, set.questions.map(question => question.id));
      // A different existing version or a release with other content is never overwritten.
      const releases = await tx.select().from(contentReleases).where(and(eq(contentReleases.targetType, "question"), inArray(contentReleases.stableId, set.questions.map(question => question.id))));
      for (const question of set.questions) {
        const release = releases.find(row => row.stableId === question.id && row.version === question.version);
        if (release && release.contentHash !== hashCanonicalJson(question)) throw new StandaloneQuestionError(`Immutable content conflict: ${question.id} v${question.version}`);
      }
      const existing = await tx.select({ stableId: questions.stableId, version: questionVersions.version }).from(questionVersions).innerJoin(questions, eq(questions.id, questionVersions.questionId)).where(inArray(questions.stableId, set.questions.map(question => question.id)));
      const fresh = set.questions.filter(question => !existing.some(row => row.stableId === question.id && row.version === question.version)).length;
      await new DrizzleQuestionRepository(tx).importVersions(set.trackId, set.questions);
      const registered = [];
      for (const question of set.questions) {
        const contentHash = hashCanonicalJson(question);
        const [created] = await tx.insert(contentReleases).values({ targetType: "question", stableId: question.id, version: question.version, contentHash, authorId: actor.ownerId }).onConflictDoNothing().returning();
        const [row] = created ? [created] : await tx.select().from(contentReleases).where(and(eq(contentReleases.targetType, "question"), eq(contentReleases.stableId, question.id), eq(contentReleases.version, question.version)));
        if (!row || row.contentHash !== contentHash) throw new StandaloneQuestionError(`Immutable content conflict: ${question.id} v${question.version}`);
        registered.push({ releaseId: row.id, id: question.id, version: question.version, status: row.status });
      }
      return { imported: fresh, unchanged: set.questions.length - fresh, releases: registered };
    });
  }
}
