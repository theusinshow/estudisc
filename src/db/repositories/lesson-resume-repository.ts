import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";
import { activities, contentBlocks, lessonResumes, lessons, modules, owners, studySessions } from "@/db/schema";
import { getDatabase } from "@/db/connection";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { resumeDataSchema, resumeScopeSchema, saveResumeSchema, type ResumeScope, type SaveResume, type ResumeSnapshot } from "@/features/lessons/resume-contracts";
import { assertResumeDrafts, assertResumeInteractions, retainInteractions, resumeReply, ResumeConflictError, ResumeUnavailableError, sessionResumeMembers, sessionResumeItem } from "@/features/lessons/resume-policy";
import type { InteractionState } from "@/features/lessons/interaction-state";
import type { InteractionSource } from "@/features/lessons/interaction-policy";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { DrizzleQuestionRepository } from "./question-repository";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
export class LessonResumeRepository {
  constructor(private readonly db: Database = getDatabase()) {}
  private where(ownerId: string, scope: ResumeScope) { return and(eq(lessonResumes.ownerId, ownerId), eq(lessonResumes.contextKey, scope.sessionId ?? "lesson"), eq(lessonResumes.trackId, scope.trackId), eq(lessonResumes.lessonId, scope.lessonId), eq(lessonResumes.version, scope.version)); }
  private async members(ownerId: string, scope: ResumeScope, interactions: readonly InteractionState[] = []) {
    if (!z.uuid().safeParse(scope.trackId).success) throw new ResumeUnavailableError();
    const [row] = await this.db.select({ lesson: lessons }).from(lessons).innerJoin(modules, eq(modules.id, lessons.moduleId)).where(and(eq(modules.trackId, scope.trackId), eq(lessons.stableId, scope.lessonId), eq(lessons.contentVersion, scope.version)));
    const metadata = row?.lesson.metadata as { status?: string; qaReleaseId?: string } | undefined;
    if (!row || metadata?.status !== "published" || !metadata.qaReleaseId) throw new ResumeUnavailableError();
    const activityRows = await this.db.select().from(activities).where(eq(activities.lessonId, row.lesson.id));
    const refs = activityRows.flatMap(activity => { const config = questionReferenceSchema.safeParse(activity.config); return activity.type === "question" && config.success ? [{ activityId: activity.stableId, questionId: config.data.questionId, questionVersion: config.data.questionVersion }] : []; });
    const versions = await new DrizzleQuestionRepository(this.db).getVersions(refs.map(ref => ({ id: ref.questionId, version: ref.questionVersion })));
    const members = refs.flatMap(ref => { const version = versions.find(version => version.question.id === ref.questionId && version.question.version === ref.questionVersion); return version ? [{ ...ref, questionType: version.question.type }] : []; });
    const session = scope.sessionId ? (await this.db.select().from(studySessions).where(and(eq(studySessions.id, scope.sessionId), eq(studySessions.ownerId, ownerId))))[0] : undefined;
    const item = sessionResumeItem(scope, session, ownerId);
    const blockIds = interactions.filter(entry => entry.target === "block").map(entry => entry.id);
    if (item?.delivery === "questions" && blockIds.length) throw new ResumeUnavailableError();
    const blockRows = blockIds.length ? await this.db.select().from(contentBlocks).where(and(eq(contentBlocks.lessonId, row.lesson.id), inArray(contentBlocks.stableId, blockIds))) : [];
    const sources: InteractionSource[] = [
      ...blockRows.map(block => ({ target: "block" as const, id: block.stableId, type: block.type, config: block.payload })),
      ...activityRows.filter(activity => !item || item.activityIds.includes(activity.stableId)).map(activity => ({ target: "activity" as const, id: activity.stableId, type: activity.type, config: activity.config }))
    ];
    return { questions: sessionResumeMembers(scope, session, ownerId, members), sources };
  }
  async get(ownerId: string, input: ResumeScope): Promise<ResumeSnapshot | null> {
    const scope = resumeScopeSchema.parse(input); await this.members(ownerId, scope);
    const [row] = await this.db.select().from(lessonResumes).where(this.where(ownerId, scope));
    return row ? { revision: row.revision, data: resumeDataSchema.parse(row.data), updatedAt: row.updatedAt.toISOString() } : null;
  }
  async save(ownerId: string, input: SaveResume, now = new Date()): Promise<ResumeSnapshot> {
    const parsed = saveResumeSchema.parse(input), mutationHash = hashCanonicalJson(parsed.data);
    return this.db.transaction(async tx => {
      await tx.insert(owners).values({ id: ownerId, displayName: "Private learner" }).onConflictDoNothing();
      await tx.select().from(owners).where(eq(owners.id, ownerId)).for("update");
      const repository = new LessonResumeRepository(tx);
      const context = await repository.members(ownerId, parsed.scope, parsed.data.interactions);
      assertResumeDrafts(parsed.data, context.questions); assertResumeInteractions(parsed.data, context.sources);
      const [current] = await tx.select().from(lessonResumes).where(repository.where(ownerId, parsed.scope));
      if (current?.mutationId === parsed.mutationId) {
        if (current.mutationHash !== mutationHash) throw new ResumeConflictError();
        return { revision: current.revision, data: resumeReply(resumeDataSchema.parse(current.data), parsed.data), updatedAt: current.updatedAt.toISOString() };
      }
      if ((current?.revision ?? 0) !== parsed.revision) throw new ResumeConflictError();
      const revision = parsed.revision + 1, data = retainInteractions(parsed.data, current ? resumeDataSchema.parse(current.data) : undefined);
      const values = { ownerId, contextKey: parsed.scope.sessionId ?? "lesson", trackId: parsed.scope.trackId, lessonId: parsed.scope.lessonId, version: parsed.scope.version, revision, mutationId: parsed.mutationId, mutationHash, data, updatedAt: now };
      await tx.insert(lessonResumes).values(values).onConflictDoUpdate({ target: [lessonResumes.ownerId, lessonResumes.contextKey, lessonResumes.trackId, lessonResumes.lessonId, lessonResumes.version], set: { revision, mutationId: parsed.mutationId, mutationHash, data, updatedAt: now } });
      return { revision, data: resumeReply(data, parsed.data), updatedAt: now.toISOString() };
    });
  }
}
