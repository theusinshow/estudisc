import { getMemoryStore } from "./memory/store";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { resumeDataSchema, resumeIdentity, resumeScopeSchema, saveResumeSchema, type ResumeScope, type SaveResume, type ResumeSnapshot } from "@/features/lessons/resume-contracts";
import { assertResumeDrafts, assertResumeInteractions, retainInteractions, resumeReply, ResumeConflictError, ResumeUnavailableError, sessionResumeMembers, sessionResumeItem } from "@/features/lessons/resume-policy";
import type { InteractionSource } from "@/features/lessons/interaction-policy";

export class MemoryLessonResumeRepository {
  constructor(private readonly store = getMemoryStore()) {}
  private members(ownerId: string, scope: ResumeScope) {
    const packs = [...this.store.packImports].reverse().flatMap(entry => { const pack = trackPackV2Schema.safeParse(entry.manifest); return pack.success ? [pack.data] : []; });
    const found = packs.filter(pack => pack.track.id === scope.trackId).flatMap(pack => pack.track.modules.flatMap(moduleRecord => moduleRecord.lessons.map(lesson => ({ pack, lesson })))).find(row => row.lesson.id === scope.lessonId && row.lesson.version === scope.version);
    if (!found || found.lesson.status !== "published") throw new ResumeUnavailableError();
    const refs = found.lesson.activities.flatMap(activity => {
      const question = found.pack.questions.find(question => question.id === activity.questionId);
      const questionVersion = question?.version;
      const config = questionReferenceSchema.safeParse({ ...activity.config, questionId: activity.questionId, questionVersion: activity.config.questionVersion ?? questionVersion });
      return activity.type === "question" && config.success && question?.version === config.data.questionVersion ? [{ activityId: activity.id, questionId: config.data.questionId, questionVersion: config.data.questionVersion, questionType: question.type }] : [];
    });
    const session = this.store.studySessions.find(session => session.id === scope.sessionId), item = sessionResumeItem(scope, session, ownerId);
    const sources: InteractionSource[] = [
      ...found.lesson.blocks.filter(() => item?.delivery !== "questions").map(block => ({ target: "block" as const, id: block.id, type: block.type, config: block.payload })),
      ...found.lesson.activities.filter(activity => !item || item.activityIds.includes(activity.id)).map(activity => ({ target: "activity" as const, id: activity.id, type: activity.type, config: activity.config }))
    ];
    return { questions: sessionResumeMembers(scope, session, ownerId, refs), sources };
  }
  async get(ownerId: string, input: ResumeScope): Promise<ResumeSnapshot | null> {
    const scope = resumeScopeSchema.parse(input); this.members(ownerId, scope);
    const row = this.store.lessonResumes.find(row => resumeIdentity(row.ownerId, row.scope) === resumeIdentity(ownerId, scope));
    return row ? structuredClone({ revision: row.revision, data: resumeDataSchema.parse(row.data), updatedAt: row.updatedAt }) : null;
  }
  async save(ownerId: string, input: SaveResume, now = new Date()): Promise<ResumeSnapshot> {
    const parsed = saveResumeSchema.parse(input), mutationHash = hashCanonicalJson(parsed.data);
    const context = this.members(ownerId, parsed.scope);
    assertResumeDrafts(parsed.data, context.questions); assertResumeInteractions(parsed.data, context.sources);
    const current = this.store.lessonResumes.find(row => resumeIdentity(row.ownerId, row.scope) === resumeIdentity(ownerId, parsed.scope));
    if (current?.mutationId === parsed.mutationId) {
      if (current.mutationHash !== mutationHash) throw new ResumeConflictError();
      return structuredClone({ revision: current.revision, data: resumeReply(current.data, parsed.data), updatedAt: current.updatedAt });
    }
    if ((current?.revision ?? 0) !== parsed.revision) throw new ResumeConflictError();
    const snapshot = { revision: parsed.revision + 1, data: structuredClone(retainInteractions(parsed.data, current?.data)), updatedAt: now.toISOString() };
    if (current) Object.assign(current, snapshot, { mutationId: parsed.mutationId, mutationHash });
    else this.store.lessonResumes.push({ ...snapshot, ownerId, scope: parsed.scope, mutationId: parsed.mutationId, mutationHash });
    return structuredClone({ ...snapshot, data: resumeReply(snapshot.data, parsed.data) });
  }
}
