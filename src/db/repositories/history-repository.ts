import { and, desc, eq, isNotNull } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { ensureDatabaseReady, getDatabase } from "@/db/connection";
import { attempts, questionVersions, studyEvents } from "@/db/schema";
import type * as schema from "@/db/schema";

type HistoryDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type HistoryEvent = Readonly<{
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  payload: unknown;
  occurredAt: Date;
}>;

/** A recorded answer to a Question (lesson, review session or simulado), newest first on the History page. */
export type HistoryAnswer = Readonly<{
  id: string;
  stem: string;
  outcome: string;
  mode: "assessment" | "learn";
  assisted: boolean;
  createdAt: Date;
}>;

/** Shared mapping for the database and memory repositories: the frozen Question content holds the stem. */
export function toHistoryAnswer(row: Readonly<{ id: string; outcome: string; context: unknown; content: unknown; createdAt: Date }>): HistoryAnswer {
  const context = (row.context ?? {}) as Record<string, unknown>;
  const stem = typeof (row.content as { stem?: unknown } | null)?.stem === "string" ? String((row.content as { stem: string }).stem) : "Questão";
  return {
    id: row.id, stem, outcome: row.outcome, createdAt: row.createdAt,
    mode: context.mode === "assessment" ? "assessment" : "learn",
    assisted: Number(context.hintLevel ?? 0) > 0 || context.solutionRevealed === true
  };
}

export class HistoryRepository {
  constructor(private readonly db: HistoryDatabase = getDatabase()) {}

  async listEvents(ownerId: string): Promise<HistoryEvent[]> {
    return this.db
      .select({
        id: studyEvents.id,
        type: studyEvents.type,
        entityType: studyEvents.entityType,
        entityId: studyEvents.entityId,
        payload: studyEvents.payload,
        occurredAt: studyEvents.occurredAt
      })
      .from(studyEvents)
      .where(eq(studyEvents.ownerId, ownerId))
      .orderBy(desc(studyEvents.occurredAt));
  }

  async listRecentAnswers(ownerId: string, limit = 40): Promise<HistoryAnswer[]> {
    const rows = await this.db
      .select({ id: attempts.id, outcome: attempts.outcome, context: attempts.context, createdAt: attempts.createdAt, content: questionVersions.content })
      .from(attempts)
      .innerJoin(questionVersions, eq(attempts.questionVersionId, questionVersions.id))
      .where(and(eq(attempts.ownerId, ownerId), isNotNull(attempts.questionVersionId)))
      .orderBy(desc(attempts.createdAt))
      .limit(limit);
    return rows.map(toHistoryAnswer);
  }
}

export async function withHistoryRepository<T>(read: (repository: HistoryRepository) => Promise<T>) {
  await ensureDatabaseReady();
  return read(new HistoryRepository());
}
