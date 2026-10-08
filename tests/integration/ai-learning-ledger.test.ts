import { describe, expect, it } from "vitest";
import { AiLearningRepository, MemoryAiLearningRepository } from "@/db/repositories/ai-learning-repository";
import { getMemoryStore } from "@/db/repositories/memory/store";
import { createMigratedPgliteTestDatabase } from "./pglite-test-db";

const now = new Date("2026-10-08T12:00:00Z"), metadata = { provider: "mock", model: "small" };
const successful = { ok: true as const, output: { text: "Fato fornecido." }, cached: false };
describe.each(["memory", "sql"] as const)("AI reservation ledger (%s)", kind => {
  async function setup() {
    const database = kind === "sql" ? await createMigratedPgliteTestDatabase() : undefined;
    const store = structuredClone(getMemoryStore()); store.events = []; store.assessmentInstances = [];
    return { database, store, ledger: database ? new AiLearningRepository(database.db) : new MemoryAiLearningRepository(store) };
  }
  it("isolates owned tickets, caches only the original provider result, and retains idempotency", async () => {
    const ctx = await setup();
    try {
      const requestId = crypto.randomUUID(), key = "a".repeat(64);
      const first = await ctx.ledger.claim("one", requestId, key, now, metadata);
      await expect(ctx.ledger.claim("one", crypto.randomUUID(), key, now, metadata)).rejects.toMatchObject({ code: "request_pending" });
      await expect(ctx.ledger.claim("one", requestId, key, now, metadata)).rejects.toMatchObject({ code: "request_pending" });
      await expect(ctx.ledger.claim("one", requestId, "b".repeat(64), now, metadata)).rejects.toMatchObject({ code: "request_conflict" });
      await expect(ctx.ledger.complete("other", first.id, successful, now)).rejects.toMatchObject({ code: "context_unavailable" });
      await ctx.ledger.complete("one", first.id, successful, now); await ctx.ledger.complete("one", first.id, successful, now);
      await expect(ctx.ledger.complete("one", first.id, { ...successful, output: { text: "Changed." } }, now)).rejects.toMatchObject({ code: "request_conflict" });
      expect(await ctx.ledger.claim("one", requestId, key, now, metadata)).toMatchObject({ id: first.id, replay: successful });
      const cached = await ctx.ledger.claim("one", crypto.randomUUID(), key, new Date(now.getTime() + 59 * 60_000), metadata);
      expect(cached.cached).toEqual(successful); await ctx.ledger.complete("one", cached.id, { ...successful, cached: true }, new Date(now.getTime() + 59 * 60_000));
      expect((await ctx.ledger.claim("one", crypto.randomUUID(), key, new Date(now.getTime() + 60 * 60_000 + 1), metadata)).cached).toBeUndefined();
      expect((await ctx.ledger.claim("other", crypto.randomUUID(), key, now, metadata)).cached).toBeUndefined();
    } finally { await ctx.database?.close(); }
  });
  it("serializes pending calls and counts failures toward minute/day caps", async () => {
    const ctx = await setup();
    try {
      const claims = await Promise.allSettled(Array.from({ length: 3 }, (_, i) => ctx.ledger.claim("pending-owner", crypto.randomUUID(), String(i).repeat(64), now, metadata)));
      expect(claims.filter(row => row.status === "fulfilled")).toHaveLength(2); expect(claims.filter(row => row.status === "rejected")).toHaveLength(1);
      for (let i = 0; i < 20; i++) {
        const time = new Date(now.getTime() + i * 61_000), key = i.toString(16).padStart(64, "0");
        const ticket = await ctx.ledger.claim("daily-owner", crypto.randomUUID(), key, time, metadata);
        await ctx.ledger.complete("daily-owner", ticket.id, { ok: false, code: "unavailable" }, time);
      }
      await expect(ctx.ledger.claim("daily-owner", crypto.randomUUID(), "f".repeat(64), new Date(now.getTime() + 20 * 61_000), metadata)).rejects.toMatchObject({ code: "daily_limit" });
      expect(await ctx.ledger.claim("daily-owner", crypto.randomUUID(), "f".repeat(64), new Date("2026-10-09T00:00:00Z"), metadata)).toBeDefined();
      for (let i = 0; i < 6; i++) { const ticket = await ctx.ledger.claim("minute-owner", crypto.randomUUID(), String(i).repeat(64), now, metadata); await ctx.ledger.complete("minute-owner", ticket.id, { ok: false, code: "timeout" }, now); }
      await expect(ctx.ledger.claim("minute-owner", crypto.randomUUID(), "f".repeat(64), now, metadata)).rejects.toMatchObject({ code: "rate_limited" });
    } finally { await ctx.database?.close(); }
  });
});
