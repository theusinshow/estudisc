import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase, getDatabaseUrl } from "@/db/connection";
import { attempts, entitlements, inviteCodes, owners, studyEvents } from "@/db/schema";
import type * as schema from "@/db/schema";
import {
  evaluateEntitlementAccess,
  LIFETIME_CURRENCY,
  LIFETIME_PRODUCT_ID,
  type AppendEntitlementInput,
  type CreateInviteCodeInput,
  type EntitlementRecord,
  type EntitlementSource,
  type EntitlementStatus,
  type InviteCodeRecord
} from "@/features/payments/contracts";
import { getMemoryStore, type MemoryStore } from "./memory/store";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export class InviteCodeError extends Error {
  constructor(
    public readonly code: "invalid_code" | "inactive_code" | "expired_code" | "exhausted_code" | "duplicate_code",
    message: string
  ) {
    super(message);
  }
}

export type AdminUserOverview = Readonly<{
  ownerId: string;
  displayName: string;
  createdAt: Date;
  activeEntitlement: boolean;
  latestEntitlement: EntitlementRecord | null;
  attemptsCount: number;
  aiRequestsCount: number;
}>;

export interface EntitlementRepository {
  hasActiveEntitlement(
    ownerId: string,
    now?: Date,
    productId?: string
  ): Promise<{ active: boolean; latest: EntitlementRecord | null }>;
  listByOwner(ownerId: string): Promise<EntitlementRecord[]>;
  appendEntitlement(
    input: AppendEntitlementInput & { displayName?: string }
  ): Promise<{ record: EntitlementRecord; created: boolean }>;
  createInviteCode(input: CreateInviteCodeInput): Promise<InviteCodeRecord>;
  listInviteCodes(): Promise<InviteCodeRecord[]>;
  redeemInviteCode(ownerId: string, rawCode: string, now?: Date, displayName?: string): Promise<EntitlementRecord>;
  listAdminUsersOverview(now?: Date): Promise<AdminUserOverview[]>;
}

function mapRow(row: typeof entitlements.$inferSelect): EntitlementRecord {
  return {
    id: row.id,
    ownerId: row.ownerId,
    productId: row.productId,
    status: row.status as EntitlementStatus,
    source: row.source as EntitlementSource,
    providerPaymentId: row.providerPaymentId ?? null,
    amountCents: row.amountCents,
    currency: row.currency,
    startsAt: row.startsAt,
    endsAt: row.endsAt ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.createdAt
  };
}

function mapInviteRow(row: typeof inviteCodes.$inferSelect): InviteCodeRecord {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    productId: row.productId,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt ?? null,
    active: row.active,
    createdBy: row.createdBy,
    createdAt: row.createdAt
  };
}

export class DrizzleEntitlementRepository implements EntitlementRepository {
  constructor(private readonly db: Database = getDatabase()) {}

  async listByOwner(ownerId: string): Promise<EntitlementRecord[]> {
    const rows = await this.db
      .select()
      .from(entitlements)
      .where(eq(entitlements.ownerId, ownerId))
      .orderBy(desc(entitlements.createdAt), desc(entitlements.id));
    return rows.map(mapRow);
  }

  async hasActiveEntitlement(
    ownerId: string,
    now: Date = new Date(),
    productId: string = LIFETIME_PRODUCT_ID
  ): Promise<{ active: boolean; latest: EntitlementRecord | null }> {
    const rows = await this.listByOwner(ownerId);
    return evaluateEntitlementAccess(rows, now, productId);
  }

  async appendEntitlement(
    input: AppendEntitlementInput & { displayName?: string }
  ): Promise<{ record: EntitlementRecord; created: boolean }> {
    return this.db.transaction(async (tx) => {
      await tx
        .insert(owners)
        .values({
          id: input.ownerId,
          displayName: input.displayName?.trim() || "Estudante Estudisc"
        })
        .onConflictDoNothing();

      if (input.providerPaymentId) {
        const [existing] = await tx
          .select()
          .from(entitlements)
          .where(
            and(
              eq(entitlements.providerPaymentId, input.providerPaymentId),
              eq(entitlements.status, input.status)
            )
          )
          .limit(1);
        if (existing) {
          return { record: mapRow(existing), created: false };
        }
      }

      const now = input.createdAt ?? new Date();
      const [inserted] = await tx
        .insert(entitlements)
        .values({
          ownerId: input.ownerId,
          productId: input.productId ?? LIFETIME_PRODUCT_ID,
          status: input.status,
          source: input.source,
          providerPaymentId: input.providerPaymentId ?? null,
          amountCents: input.amountCents ?? 0,
          currency: input.currency ?? LIFETIME_CURRENCY,
          startsAt: input.startsAt ?? now,
          endsAt: input.endsAt ?? null,
          metadata: input.metadata ?? {},
          createdAt: now
        })
        .returning();

      return { record: mapRow(inserted), created: true };
    });
  }

  async createInviteCode(input: CreateInviteCodeInput): Promise<InviteCodeRecord> {
    const normalized = input.code.trim().toUpperCase();
    const [existing] = await this.db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, normalized))
      .limit(1);
    if (existing) {
      throw new InviteCodeError("duplicate_code", "Já existe um código de convite com este identificador.");
    }
    const [row] = await this.db
      .insert(inviteCodes)
      .values({
        code: normalized,
        label: input.label.trim(),
        productId: input.productId ?? LIFETIME_PRODUCT_ID,
        maxUses: input.maxUses,
        usedCount: 0,
        expiresAt: input.expiresAt ?? null,
        active: true,
        createdBy: input.createdBy
      })
      .returning();
    return mapInviteRow(row);
  }

  async listInviteCodes(): Promise<InviteCodeRecord[]> {
    const rows = await this.db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
    return rows.map(mapInviteRow);
  }

  async redeemInviteCode(
    ownerId: string,
    rawCode: string,
    now: Date = new Date(),
    displayName?: string
  ): Promise<EntitlementRecord> {
    const normalized = rawCode.trim().toUpperCase();
    return this.db.transaction(async (tx) => {
      await tx
        .insert(owners)
        .values({
          id: ownerId,
          displayName: displayName?.trim() || "Estudante Estudisc"
        })
        .onConflictDoNothing();

      const ownerRows = await tx
        .select()
        .from(entitlements)
        .where(eq(entitlements.ownerId, ownerId))
        .orderBy(desc(entitlements.createdAt), desc(entitlements.id));
      const current = evaluateEntitlementAccess(ownerRows.map(mapRow), now, LIFETIME_PRODUCT_ID);
      if (current.active && current.latest) {
        return current.latest;
      }

      const [invite] = await tx
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, normalized))
        .for("update");

      if (!invite) {
        throw new InviteCodeError("invalid_code", "Código de convite não encontrado.");
      }
      if (!invite.active) {
        throw new InviteCodeError("inactive_code", "Este código de convite foi desativado.");
      }
      if (invite.expiresAt && now.getTime() >= invite.expiresAt.getTime()) {
        throw new InviteCodeError("expired_code", "Este código de convite já expirou.");
      }
      if (invite.usedCount >= invite.maxUses) {
        throw new InviteCodeError("exhausted_code", "Este código de convite atingiu o limite de vagas.");
      }

      await tx
        .update(inviteCodes)
        .set({ usedCount: invite.usedCount + 1 })
        .where(eq(inviteCodes.id, invite.id));

      const [granted] = await tx
        .insert(entitlements)
        .values({
          ownerId,
          productId: invite.productId,
          status: "granted",
          source: "invite_code",
          providerPaymentId: null,
          amountCents: 0,
          currency: LIFETIME_CURRENCY,
          startsAt: now,
          endsAt: null,
          metadata: { inviteCode: normalized, inviteId: invite.id, label: invite.label },
          createdAt: now
        })
        .returning();

      return mapRow(granted);
    });
  }

  async listAdminUsersOverview(now: Date = new Date()): Promise<AdminUserOverview[]> {
    const [ownerRows, entitlementRows, attemptCounts, aiCounts] = await Promise.all([
      this.db.select().from(owners).orderBy(desc(owners.createdAt)),
      this.db.select().from(entitlements).orderBy(desc(entitlements.createdAt), desc(entitlements.id)),
      this.db
        .select({ ownerId: attempts.ownerId, count: sql<number>`count(*)::int` })
        .from(attempts)
        .groupBy(attempts.ownerId),
      this.db
        .select({ ownerId: studyEvents.ownerId, count: sql<number>`count(*)::int` })
        .from(studyEvents)
        .where(eq(studyEvents.type, "ai_request"))
        .groupBy(studyEvents.ownerId)
    ]);

    const attemptsByOwner = new Map(attemptCounts.map((row) => [row.ownerId, Number(row.count)]));
    const aiByOwner = new Map(aiCounts.map((row) => [row.ownerId, Number(row.count)]));
    const entitlementsByOwner = new Map<string, EntitlementRecord[]>();
    for (const row of entitlementRows) {
      const mapped = mapRow(row);
      const list = entitlementsByOwner.get(mapped.ownerId) ?? [];
      list.push(mapped);
      entitlementsByOwner.set(mapped.ownerId, list);
    }

    return ownerRows.map((owner) => {
      const ownerEntitlements = entitlementsByOwner.get(owner.id) ?? [];
      const evaluation = evaluateEntitlementAccess(ownerEntitlements, now, LIFETIME_PRODUCT_ID);
      return {
        ownerId: owner.id,
        displayName: owner.displayName,
        createdAt: owner.createdAt,
        activeEntitlement: evaluation.active,
        latestEntitlement: evaluation.latest,
        attemptsCount: attemptsByOwner.get(owner.id) ?? 0,
        aiRequestsCount: aiByOwner.get(owner.id) ?? 0
      };
    });
  }
}

export class MemoryEntitlementRepository implements EntitlementRepository {
  constructor(private readonly store: MemoryStore = getMemoryStore()) {}

  private get entitlementsList(): EntitlementRecord[] {
    return (this.store.entitlements ??= []);
  }

  private get inviteCodesList(): InviteCodeRecord[] {
    return (this.store.inviteCodes ??= []);
  }

  async listByOwner(ownerId: string): Promise<EntitlementRecord[]> {
    return this.entitlementsList
      .filter((row) => row.ownerId === ownerId)
      .slice()
      .sort((a, b) => {
        const diff = b.createdAt.getTime() - a.createdAt.getTime();
        return diff !== 0 ? diff : b.id.localeCompare(a.id);
      });
  }

  async hasActiveEntitlement(
    ownerId: string,
    now: Date = new Date(),
    productId: string = LIFETIME_PRODUCT_ID
  ): Promise<{ active: boolean; latest: EntitlementRecord | null }> {
    const rows = await this.listByOwner(ownerId);
    return evaluateEntitlementAccess(rows, now, productId);
  }

  async appendEntitlement(
    input: AppendEntitlementInput & { displayName?: string }
  ): Promise<{ record: EntitlementRecord; created: boolean }> {
    if (input.providerPaymentId) {
      const existing = this.entitlementsList.find(
        (row) => row.providerPaymentId === input.providerPaymentId && row.status === input.status
      );
      if (existing) {
        return { record: existing, created: false };
      }
    }

    const now = input.createdAt ?? new Date();
    const record: EntitlementRecord = {
      id: randomUUID(),
      ownerId: input.ownerId,
      productId: input.productId ?? LIFETIME_PRODUCT_ID,
      status: input.status,
      source: input.source,
      providerPaymentId: input.providerPaymentId ?? null,
      amountCents: input.amountCents ?? 0,
      currency: input.currency ?? LIFETIME_CURRENCY,
      startsAt: input.startsAt ?? now,
      endsAt: input.endsAt ?? null,
      metadata: { ...(input.metadata ?? {}), ...(input.displayName ? { displayName: input.displayName } : {}) },
      createdAt: now
    };
    this.entitlementsList.push(record);
    return { record, created: true };
  }

  async createInviteCode(input: CreateInviteCodeInput): Promise<InviteCodeRecord> {
    const normalized = input.code.trim().toUpperCase();
    if (this.inviteCodesList.some((row) => row.code === normalized)) {
      throw new InviteCodeError("duplicate_code", "Já existe um código de convite com este identificador.");
    }
    const record: InviteCodeRecord = {
      id: randomUUID(),
      code: normalized,
      label: input.label.trim(),
      productId: input.productId ?? LIFETIME_PRODUCT_ID,
      maxUses: input.maxUses,
      usedCount: 0,
      expiresAt: input.expiresAt ?? null,
      active: true,
      createdBy: input.createdBy,
      createdAt: new Date()
    };
    this.inviteCodesList.push(record);
    return record;
  }

  async listInviteCodes(): Promise<InviteCodeRecord[]> {
    return this.inviteCodesList
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async redeemInviteCode(
    ownerId: string,
    rawCode: string,
    now: Date = new Date(),
    displayName?: string
  ): Promise<EntitlementRecord> {
    const normalized = rawCode.trim().toUpperCase();
    const current = await this.hasActiveEntitlement(ownerId, now, LIFETIME_PRODUCT_ID);
    if (current.active && current.latest) {
      return current.latest;
    }

    const index = this.inviteCodesList.findIndex((row) => row.code === normalized);
    if (index === -1) {
      throw new InviteCodeError("invalid_code", "Código de convite não encontrado.");
    }
    const invite = this.inviteCodesList[index];
    if (!invite.active) {
      throw new InviteCodeError("inactive_code", "Este código de convite foi desativado.");
    }
    if (invite.expiresAt && now.getTime() >= invite.expiresAt.getTime()) {
      throw new InviteCodeError("expired_code", "Este código de convite já expirou.");
    }
    if (invite.usedCount >= invite.maxUses) {
      throw new InviteCodeError("exhausted_code", "Este código de convite atingiu o limite de vagas.");
    }

    this.inviteCodesList[index] = {
      ...invite,
      usedCount: invite.usedCount + 1
    };

    const { record } = await this.appendEntitlement({
      ownerId,
      displayName,
      productId: invite.productId,
      status: "granted",
      source: "invite_code",
      amountCents: 0,
      currency: LIFETIME_CURRENCY,
      startsAt: now,
      endsAt: null,
      metadata: { inviteCode: normalized, inviteId: invite.id, label: invite.label },
      createdAt: now
    });
    return record;
  }

  async listAdminUsersOverview(now: Date = new Date()): Promise<AdminUserOverview[]> {
    const ownerIds = new Set<string>();
    for (const e of this.entitlementsList) ownerIds.add(e.ownerId);
    for (const a of this.store.attempts) ownerIds.add(a.ownerId);
    for (const ev of this.store.events) {
      if (ev.ownerId) ownerIds.add(ev.ownerId);
    }

    const result: AdminUserOverview[] = [];
    for (const ownerId of ownerIds) {
      const ownerEntitlements = await this.listByOwner(ownerId);
      const evaluation = evaluateEntitlementAccess(ownerEntitlements, now, LIFETIME_PRODUCT_ID);
      const displayName =
        (evaluation.latest?.metadata?.displayName as string | undefined) || ownerId;
      const createdAt =
        ownerEntitlements[ownerEntitlements.length - 1]?.createdAt ?? new Date();
      result.push({
        ownerId,
        displayName,
        createdAt,
        activeEntitlement: evaluation.active,
        latestEntitlement: evaluation.latest,
        attemptsCount: this.store.attempts.filter((a) => a.ownerId === ownerId).length,
        aiRequestsCount: this.store.events.filter(
          (e) => e.ownerId === ownerId && e.type === "ai_request"
        ).length
      });
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export function getEntitlementRepository(): EntitlementRepository {
  const url = getDatabaseUrl();
  if (!url || url === "memory://local") {
    return new MemoryEntitlementRepository();
  }
  return new DrizzleEntitlementRepository();
}
