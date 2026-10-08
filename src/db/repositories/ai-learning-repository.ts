import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, or, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import { getDatabase } from "@/db/connection";
import { assessmentInstances, owners, studyEvents } from "@/db/schema";
import type * as schema from "@/db/schema";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { AI_POLICY, AiLearningError, aiOutcomeSchema, type AiOutcome } from "@/features/ai/contracts";
import type { AiLedger } from "@/features/ai/ai-service";
import { AI_CACHE_MS, decideAiClaim, type AiClaim, type AiReservation } from "@/features/ai/usage-policy";
import { getMemoryStore, type MemoryStore } from "./memory/store";
import type { HistoryEvent } from "./history-repository";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
const requestPayload = z.object({ requestId: z.uuid(), key: z.string().regex(/^[a-f0-9]{64}$/), policyVersion: z.string().regex(/^ai-learning\.v[1-9]\d*$/), providerCall: z.boolean(), provider: z.string().min(1).max(120), model: z.string().min(1).max(120) }).strict();
const completionPayload = z.object({ requestId: z.uuid(), ticketId: z.uuid(), outcome: aiOutcomeSchema }).strict();
type Metadata = { provider: string; model: string };
function facts(events: readonly HistoryEvent[]): AiReservation[] {
  return events.filter(e => e.type === "ai_request").flatMap(event => {
    const request = requestPayload.safeParse(event.payload);
    if (!request.success) return [];
    const completed = events.filter(e => e.type === "ai_completion" && e.entityId === event.id).map(e => ({ event: e, data: completionPayload.safeParse(e.payload) })).find(e => e.data.success && e.data.data.ticketId === event.id && e.data.data.requestId === request.data.requestId);
    return [{ id: event.id, requestId: request.data.requestId, key: request.data.key, providerCall: request.data.providerCall, createdAt: event.occurredAt,
      ...(completed?.data.success ? { outcome: completed.data.data.outcome, completedAt: completed.event.occurredAt } : {}) }];
  });
}
function earliest(now: Date) { return new Date(Math.min(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()), now.getTime() - AI_CACHE_MS)); }

export class AiLearningRepository implements AiLedger {
  constructor(private readonly db: Database = getDatabase()) {}
  async assertAllowed(ownerId: string, db = this.db) {
    const [exam] = await db.select({ id: assessmentInstances.id }).from(assessmentInstances).where(and(eq(assessmentInstances.ownerId, ownerId), eq(assessmentInstances.status, "ACTIVE"), eq(assessmentInstances.mode, "EXAM"))).limit(1);
    if (exam) throw new AiLearningError("exam_active");
  }
  async claim(ownerId: string, requestId: string, key: string, now: Date, metadata: Metadata): Promise<AiClaim> {
    return this.db.transaction(async tx => {
      await tx.insert(owners).values({ id: ownerId, displayName: "Local owner" }).onConflictDoNothing();
      await tx.select({ id: owners.id }).from(owners).where(eq(owners.id, ownerId)).for("update");
      await this.assertAllowed(ownerId, tx);
      const events = await tx.select().from(studyEvents).where(and(eq(studyEvents.ownerId, ownerId), inArray(studyEvents.type, ["ai_request", "ai_completion"]), or(gte(studyEvents.occurredAt, earliest(now)), sql`${studyEvents.payload}->>'requestId' = ${requestId}`)));
      const rows = facts(events), decision = decideAiClaim(rows, { requestId, key }, now);
      if (decision.kind === "existing") {
        if (decision.claim.replay && !rows.find(row => row.id === decision.claim.id)?.outcome) await tx.insert(studyEvents).values({ ownerId, type: "ai_completion", entityType: "ai_request", entityId: decision.claim.id, payload: completionPayload.parse({ requestId, ticketId: decision.claim.id, outcome: decision.claim.replay }), occurredAt: now });
        return decision.claim;
      }
      const [row] = await tx.insert(studyEvents).values({ ownerId, type: "ai_request", entityType: "ai_request", entityId: requestId, payload: requestPayload.parse({ requestId, key, policyVersion: AI_POLICY, providerCall: decision.providerCall, ...metadata }), occurredAt: now }).returning({ id: studyEvents.id });
      return { id: row.id, ...(decision.cached ? { cached: decision.cached } : {}) };
    });
  }
  async complete(ownerId: string, ticketId: string, rawOutcome: AiOutcome, now: Date) {
    const outcome = aiOutcomeSchema.parse(rawOutcome);
    await this.db.transaction(async tx => {
      await tx.select({ id: owners.id }).from(owners).where(eq(owners.id, ownerId)).for("update");
      if (outcome.ok) await this.assertAllowed(ownerId, tx);
      const [request] = await tx.select().from(studyEvents).where(and(eq(studyEvents.ownerId, ownerId), eq(studyEvents.id, ticketId), eq(studyEvents.type, "ai_request"))).limit(1);
      const parsed = requestPayload.safeParse(request?.payload);
      if (!parsed.success) throw new AiLearningError("context_unavailable");
      const [completed] = await tx.select().from(studyEvents).where(and(eq(studyEvents.ownerId, ownerId), eq(studyEvents.type, "ai_completion"), eq(studyEvents.entityId, ticketId))).limit(1);
      if (completed) {
        if (hashCanonicalJson(completionPayload.parse(completed.payload).outcome) !== hashCanonicalJson(outcome)) throw new AiLearningError("request_conflict");
        return;
      }
      await tx.insert(studyEvents).values({ ownerId, type: "ai_completion", entityType: "ai_request", entityId: ticketId, payload: completionPayload.parse({ ticketId, requestId: parsed.data.requestId, outcome }), occurredAt: now });
    });
  }
}

export class MemoryAiLearningRepository implements AiLedger {
  constructor(private readonly store: MemoryStore = getMemoryStore()) {}
  async assertAllowed(ownerId: string) {
    if (this.store.assessmentInstances.some(row => row.ownerId === ownerId && row.status === "ACTIVE" && row.snapshot.mode === "EXAM")) throw new AiLearningError("exam_active");
  }
  async claim(ownerId: string, requestId: string, key: string, now: Date, metadata: Metadata): Promise<AiClaim> {
    // Synchronous critical section: the memory harness never yields between reading and appending.
    if (this.store.assessmentInstances.some(row => row.ownerId === ownerId && row.status === "ACTIVE" && row.snapshot.mode === "EXAM")) throw new AiLearningError("exam_active");
    const events = this.store.events.filter(e => e.ownerId === ownerId && (e.occurredAt >= earliest(now) || (e.payload as { requestId?: string })?.requestId === requestId));
    const rows = facts(events), decision = decideAiClaim(rows, { requestId, key }, now);
    if (decision.kind === "existing") {
      if (decision.claim.replay && !rows.find(row => row.id === decision.claim.id)?.outcome) this.store.events.push({ id: randomUUID(), ownerId, type: "ai_completion", entityType: "ai_request", entityId: decision.claim.id, payload: completionPayload.parse({ requestId, ticketId: decision.claim.id, outcome: decision.claim.replay }), occurredAt: now });
      return decision.claim;
    }
    const id = randomUUID();
    this.store.events.push({ id, ownerId, type: "ai_request", entityType: "ai_request", entityId: requestId, payload: requestPayload.parse({ requestId, key, policyVersion: AI_POLICY, providerCall: decision.providerCall, ...metadata }), occurredAt: now });
    return { id, ...(decision.cached ? { cached: decision.cached } : {}) };
  }
  async complete(ownerId: string, ticketId: string, rawOutcome: AiOutcome, now: Date) {
    const outcome = aiOutcomeSchema.parse(rawOutcome);
    if (outcome.ok && this.store.assessmentInstances.some(row => row.ownerId === ownerId && row.status === "ACTIVE" && row.snapshot.mode === "EXAM")) throw new AiLearningError("exam_active");
    const request = this.store.events.find(e => e.ownerId === ownerId && e.id === ticketId && e.type === "ai_request"), parsed = requestPayload.safeParse(request?.payload);
    if (!parsed.success) throw new AiLearningError("context_unavailable");
    const completed = this.store.events.find(e => e.ownerId === ownerId && e.type === "ai_completion" && e.entityId === ticketId);
    if (completed) {
      if (hashCanonicalJson(completionPayload.parse(completed.payload).outcome) !== hashCanonicalJson(outcome)) throw new AiLearningError("request_conflict");
      return;
    }
    this.store.events.push({ id: randomUUID(), ownerId, type: "ai_completion", entityType: "ai_request", entityId: ticketId, payload: completionPayload.parse({ ticketId, requestId: parsed.data.requestId, outcome }), occurredAt: now });
  }
}
