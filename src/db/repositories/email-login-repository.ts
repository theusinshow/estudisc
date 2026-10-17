import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabase, getDatabaseUrl } from "@/db/connection";
import { authRateEvents, emailLoginCodes } from "@/db/schema";
import type * as schema from "@/db/schema";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export type EmailLoginCodeRecord = Readonly<{
  id: string;
  emailHash: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  createdAt: Date;
}>;

/** Storage for email one-time codes and sign-in rate limits (ADR 0068). */
export interface EmailLoginRepository {
  countRateEvents(kind: string, key: string, since: Date): Promise<number>;
  recordRateEvent(kind: string, key: string, at: Date): Promise<void>;
  insertCode(input: { emailHash: string; codeHash: string; expiresAt: Date; createdAt: Date }): Promise<void>;
  /** Latest code for the email that is neither consumed nor expired. */
  findActiveCode(emailHash: string, now: Date): Promise<EmailLoginCodeRecord | null>;
  /** Atomically adds one attempt and returns the new count. */
  incrementAttempts(id: string): Promise<number>;
  /** Marks the code consumed; false when it was already consumed (single use under concurrency). */
  consumeCode(id: string, now: Date): Promise<boolean>;
  pruneBefore(before: Date): Promise<void>;
}

export class DrizzleEmailLoginRepository implements EmailLoginRepository {
  constructor(private readonly db: Database = getDatabase()) {}

  async countRateEvents(kind: string, key: string, since: Date) {
    const [row] = await this.db.select({ value: count() }).from(authRateEvents)
      .where(and(eq(authRateEvents.kind, kind), eq(authRateEvents.key, key), gte(authRateEvents.createdAt, since)));
    return Number(row?.value ?? 0);
  }

  async recordRateEvent(kind: string, key: string, at: Date) {
    await this.db.insert(authRateEvents).values({ kind, key, createdAt: at });
  }

  async insertCode(input: { emailHash: string; codeHash: string; expiresAt: Date; createdAt: Date }) {
    await this.db.insert(emailLoginCodes).values(input);
  }

  async findActiveCode(emailHash: string, now: Date) {
    const [row] = await this.db.select().from(emailLoginCodes)
      .where(and(eq(emailLoginCodes.emailHash, emailHash), isNull(emailLoginCodes.consumedAt), gt(emailLoginCodes.expiresAt, now)))
      .orderBy(desc(emailLoginCodes.createdAt)).limit(1);
    return row ? { ...row, consumedAt: row.consumedAt ?? null } : null;
  }

  async incrementAttempts(id: string) {
    const [row] = await this.db.update(emailLoginCodes).set({ attempts: sql`${emailLoginCodes.attempts} + 1` })
      .where(eq(emailLoginCodes.id, id)).returning({ attempts: emailLoginCodes.attempts });
    return row?.attempts ?? Number.MAX_SAFE_INTEGER;
  }

  async consumeCode(id: string, now: Date) {
    const rows = await this.db.update(emailLoginCodes).set({ consumedAt: now })
      .where(and(eq(emailLoginCodes.id, id), isNull(emailLoginCodes.consumedAt))).returning({ id: emailLoginCodes.id });
    return rows.length === 1;
  }

  async pruneBefore(before: Date) {
    await this.db.delete(authRateEvents).where(lt(authRateEvents.createdAt, before));
    await this.db.delete(emailLoginCodes).where(lt(emailLoginCodes.createdAt, before));
  }
}

type MemoryEmailLoginState = { codes: Array<{ -readonly [K in keyof EmailLoginCodeRecord]: EmailLoginCodeRecord[K] }>; events: Array<{ kind: string; key: string; at: Date }> };
const memoryGlobal = globalThis as typeof globalThis & { __estudiscEmailLogin?: MemoryEmailLoginState };

export function resetMemoryEmailLogin() {
  memoryGlobal.__estudiscEmailLogin = { codes: [], events: [] };
}

export class MemoryEmailLoginRepository implements EmailLoginRepository {
  private get state() {
    memoryGlobal.__estudiscEmailLogin ??= { codes: [], events: [] };
    return memoryGlobal.__estudiscEmailLogin;
  }

  async countRateEvents(kind: string, key: string, since: Date) {
    return this.state.events.filter(event => event.kind === kind && event.key === key && event.at >= since).length;
  }

  async recordRateEvent(kind: string, key: string, at: Date) {
    this.state.events.push({ kind, key, at });
  }

  async insertCode(input: { emailHash: string; codeHash: string; expiresAt: Date; createdAt: Date }) {
    this.state.codes.push({ id: randomUUID(), attempts: 0, consumedAt: null, ...input });
  }

  async findActiveCode(emailHash: string, now: Date) {
    const active = this.state.codes.filter(code => code.emailHash === emailHash && !code.consumedAt && code.expiresAt > now);
    return active.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
  }

  async incrementAttempts(id: string) {
    const code = this.state.codes.find(entry => entry.id === id);
    if (!code) return Number.MAX_SAFE_INTEGER;
    code.attempts += 1;
    return code.attempts;
  }

  async consumeCode(id: string, now: Date) {
    const code = this.state.codes.find(entry => entry.id === id);
    if (!code || code.consumedAt) return false;
    code.consumedAt = now;
    return true;
  }

  async pruneBefore(before: Date) {
    this.state.events = this.state.events.filter(event => event.at >= before);
    this.state.codes = this.state.codes.filter(code => code.createdAt >= before);
  }
}

export function getEmailLoginRepository(): EmailLoginRepository {
  const url = getDatabaseUrl();
  if (!url || url === "memory://local") return new MemoryEmailLoginRepository();
  return new DrizzleEmailLoginRepository();
}
