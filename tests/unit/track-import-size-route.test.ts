// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { POST as preview } from "@/app/api/import/track/preview/route";
import { POST as apply } from "@/app/api/import/track/route";
import { MAX_TRACK_PACK_BYTES } from "@/features/import/application/import-request";
import { buildGhPack, GH_BATCHES } from "../../tools/science-import/history-geography";

vi.mock("@/db/connection", () => ({ ensureDatabaseReady: async () => {}, getDatabaseUrl: () => "memory://local" }));
vi.mock("@/features/auth/owner", async importOriginal => ({
  ...await importOriginal<typeof import("@/features/auth/owner")>(),
  requireAdmin: async () => ({ ownerId: "pack-limit-test-admin", role: "ADMIN" as const })
}));
const request = (body: string) => new Request("http://localhost/api/import/track", { method: "POST", headers: { "Content-Type": "application/json" }, body });

describe("Track Pack route byte bounds", () => {
  it("previews and applies the complete GH source-bound pack above one MiB with actual core validation and idempotence", async () => {
    const result = buildGhPack(process.cwd(), GH_BATCHES.flat(), 7);
    const body = JSON.stringify(result.pack);
    expect(Buffer.byteLength(body)).toBeGreaterThan(1024 * 1024);
    const before = await preview(request(body));
    expect(before.status).toBe(200);
    expect(await before.json()).toMatchObject({ status: "ready", contentHash: result.contentHash, summary: { lessonCount: 49, activityCount: 392, conceptCount: 293 } });
    const imported = await apply(request(body));
    expect(imported.status).toBe(201);
    expect(await imported.json()).toMatchObject({ status: "imported", summary: { importedLessons: 49, importedActivities: 392 } });
    const retry = await apply(request(body));
    expect(retry.status).toBe(200);
    expect(await retry.json()).toMatchObject({ status: "already_imported" });
  });
  it("returns 413 from preview and apply for actual bodies above two MiB", async () => {
    const body = JSON.stringify("x".repeat(MAX_TRACK_PACK_BYTES - 1));
    for (const route of [preview, apply]) {
      const response = await route(request(body));
      expect(response.status).toBe(413);
      expect(await response.json()).toMatchObject({ code: "payload_too_large", maxBytes: MAX_TRACK_PACK_BYTES, byteLength: MAX_TRACK_PACK_BYTES + 1 });
    }
  });
});
