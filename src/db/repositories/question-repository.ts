import { and, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { concepts, contentSourceLinks, contentSources, questionChoices, questionConcepts, questions, questionVersions } from "@/db/schema";
import { questionSchema, type Question } from "@/features/questions/api";
import { hashCanonicalJson } from "@/lib/canonical-json";

type QuestionDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;
export class QuestionVersionConflictError extends Error {
  constructor() { super("Question version already exists with different content."); }
}

export class DrizzleQuestionRepository {
  constructor(private readonly db: QuestionDatabase = getDatabase()) {}
  async importVersions(trackId: string, input: readonly unknown[]) {
    const incoming = input.map(question => questionSchema.parse(question));
    return this.db.transaction(async tx => {
      const conceptRows = incoming.length ? await tx.select().from(concepts).where(inArray(concepts.stableId, incoming.flatMap(question => question.conceptIds))) : [];
      const conceptIds = new Map(conceptRows.map(concept => [concept.stableId, concept.id]));
      for (const question of incoming) {
        if (question.conceptIds.some(id => !conceptIds.has(id))) throw new Error("Unknown Question Concept");
        await tx.insert(questions).values({ stableId: question.id }).onConflictDoNothing();
        const [identity] = await tx.select().from(questions).where(eq(questions.stableId, question.id));
        const contentHash = hashCanonicalJson(question);
        const [created] = await tx.insert(questionVersions).values({ questionId: identity.id, version: question.version, subjectCode: question.subjectCode, type: question.type, difficulty: question.difficulty, status: question.status, contentHash, content: question }).onConflictDoNothing().returning();
        const [version] = created ? [created] : await tx.select().from(questionVersions).where(and(eq(questionVersions.questionId, identity.id), eq(questionVersions.version, question.version)));
        if (!version || version.contentHash !== contentHash) throw new QuestionVersionConflictError();
        if (!created) continue;
        for (const [index, choice] of (question.choices ?? []).entries()) await tx.insert(questionChoices).values({ questionVersionId: version.id, stableId: choice.id, orderIndex: index, content: choice.content, correct: choice.correct ? 1 : 0, targetsError: choice.targetsError, rationale: choice.rationale });
        for (const id of question.conceptIds) await tx.insert(questionConcepts).values({ questionVersionId: version.id, conceptId: conceptIds.get(id)!, role: id === question.primaryConceptId ? "primary" : "secondary" });
        for (const id of question.sourceIds) {
          const [source] = await tx.select().from(contentSources).where(eq(contentSources.stableId, id));
          if (!source) throw new Error("Unknown Question source");
          await tx.insert(contentSourceLinks).values({ trackId, sourceId: source.id, targetType: "question", targetStableId: question.id, targetVersion: String(question.version) }).onConflictDoNothing();
        }
      }
      return { questionVersions: incoming.length };
    });
  }

  async getVersion(stableId: string, version: number): Promise<{ versionId: string; question: Question } | null> {
    const [row] = await this.db.select({ versionId: questionVersions.id, content: questionVersions.content }).from(questionVersions).innerJoin(questions, eq(questions.id, questionVersions.questionId)).where(and(eq(questions.stableId, stableId), eq(questionVersions.version, version)));
    return row ? { versionId: row.versionId, question: questionSchema.parse(row.content) } : null;
  }
}
