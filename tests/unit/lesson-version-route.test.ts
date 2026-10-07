// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { POST as apply } from "@/app/api/import/lesson/route";
import { POST as preview } from "@/app/api/import/lesson/preview/route";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { MAX_TRACK_PACK_BYTES } from "@/features/import/api";
import { lessonVersionFixture } from "../fixtures/lesson-version-import";
const state = vi.hoisted(() => ({ student: false }));
vi.mock("@/db/connection", () => ({ ensureDatabaseReady: async () => {}, getDatabaseUrl: () => "memory://local" }));
vi.mock("@/features/auth/owner", async original => {
  const authModule = await original<typeof import("@/features/auth/owner")>();
  return { ...authModule, requireAdmin: async () => { if (state.student) throw new authModule.AccessDeniedError(); return { ownerId: "route-fixture-admin", role: "ADMIN" as const }; } };
});
const request = (body: unknown) => new Request("http://localhost/api/import/lesson", { method: "POST", body: JSON.stringify(body) });

describe("targeted import ADMIN boundary and compatible UI responses", () => {
  it("previews without writes, imports once and rejects stale receipts/Student writes", async () => {
    const { context, packet } = lessonVersionFixture(true);
    await new MemoryTrackImportRepository().applyTrackPack(context, hashCanonicalJson(context));
    const checked = await preview(request(packet));
    expect(checked.status).toBe(200); expect(await checked.json()).toMatchObject({ status: "ready", operation: "import", summary: { lessonCount: 1, activityCount: 18 } });
    expect((await apply(request(packet))).status).toBe(201);
    expect((await apply(request(packet))).status).toBe(200);
    expect((await preview(request({ ...packet, authorId: "changed" }))).status).toBe(409);
    state.student = true;
    try { for (const route of [preview, apply]) expect((await route(request(packet))).status).toBe(403); } finally { state.student = false; }
  });
  it("returns 400 for invalid contracts and 413 for oversized bodies before any import", async () => {
    for (const route of [preview, apply]) {
      expect((await route(request({ schema: "caderno.lesson.v2" }))).status).toBe(400);
      expect((await route(request({ ...lessonVersionFixture(true).packet, version: 2147483648 }))).status).toBe(400);
      expect((await route(new Request("http://localhost", { method: "POST", body: JSON.stringify("x".repeat(MAX_TRACK_PACK_BYTES)) }))).status).toBe(413);
    }
  });
});
