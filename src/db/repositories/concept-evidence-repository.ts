import { and, desc, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import { conceptEvidence, concepts } from "@/db/schema";
import type * as schema from "@/db/schema";

type ConceptEvidenceDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type ConceptEvidenceRecord = Readonly<{
  id: string;
  conceptStableId: string;
  type: string;
  strength: number;
  sourceType: string;
  sourceId: string;
  attemptId: string | null;
  conditions: Record<string, unknown>;
  createdAt: Date;
}>;

export class ConceptEvidenceRepository {
  constructor(private readonly db: ConceptEvidenceDatabase = getDatabase()) {}

  async listForConcept(ownerId: string, conceptStableId: string): Promise<ConceptEvidenceRecord[]> {
    return this.listForConcepts(ownerId, [conceptStableId]);
  }

  async listForConcepts(ownerId: string, conceptStableIds: readonly string[]): Promise<ConceptEvidenceRecord[]> {
    if (!conceptStableIds.length) return [];
    return this.readEvidence(ownerId, [...new Set(conceptStableIds)]);
  }

  async listForOwner(ownerId: string): Promise<ConceptEvidenceRecord[]> {
    return this.readEvidence(ownerId);
  }

  private async readEvidence(ownerId: string, conceptStableIds?: readonly string[]): Promise<ConceptEvidenceRecord[]> {
    const rows = await this.db.select({ id: conceptEvidence.id, conceptStableId: concepts.stableId, type: conceptEvidence.type, strength: conceptEvidence.strength, sourceType: conceptEvidence.sourceType, sourceId: conceptEvidence.sourceId, attemptId: conceptEvidence.attemptId, conditions: conceptEvidence.conditions, createdAt: conceptEvidence.createdAt })
      .from(conceptEvidence).innerJoin(concepts, eq(concepts.id, conceptEvidence.conceptId))
      .where(conceptStableIds ? and(eq(conceptEvidence.ownerId, ownerId), inArray(concepts.stableId, [...conceptStableIds])) : eq(conceptEvidence.ownerId, ownerId))
      .orderBy(desc(conceptEvidence.createdAt));
    return rows.map(row => ({ ...row, conditions: parseConditions(row.conditions) }));
  }

}

function parseConditions(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
