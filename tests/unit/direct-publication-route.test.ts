import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/features/auth/owner";
import { POST } from "@/app/api/admin/content-qa/route";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), publish: vi.fn(), constructed: vi.fn() }));
vi.mock("@/features/auth/owner", async importOriginal => ({
  ...await importOriginal<typeof import("@/features/auth/owner")>(), requireAdmin: mocks.requireAdmin
}));
vi.mock("@/db/repositories/content-qa-repository", () => ({
  ContentQaRepository: class {
    constructor() { mocks.constructed(); }
    publishLessonsDirect = mocks.publish;
  }
}));

const payload = { action: "publish_lessons_direct", lessons: [{ lessonId: "CIE-01", version: 2 }], reason: "Publicação direta autorizada pelo responsável." };
const request = (body: unknown = payload) => new Request("http://localhost/api/admin/content-qa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("direct publication API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ ownerId: "admin", role: "ADMIN" });
    mocks.publish.mockResolvedValue({ published: true, lessons: 1, releases: 9, newlyPublished: 9 });
  });
  it("uses the authenticated ADMIN identity and the validated exact targets", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ published: true, lessons: 1 });
    expect(mocks.publish).toHaveBeenCalledWith({ ownerId: "admin", role: "ADMIN" }, { lessons: payload.lessons, reason: payload.reason });
  });
  it("denies unauthorized access before parsing or connecting to the repository", async () => {
    mocks.requireAdmin.mockRejectedValue(new AccessDeniedError());
    expect((await POST(request())).status).toBe(403);
    expect(mocks.constructed).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
  });
  it("rejects malformed requests, oversized input and impersonation without publishing", async () => {
    expect((await POST(request({ ...payload, actorId: "other-admin" }))).status).toBe(409);
    expect((await POST(request({ ...payload, lessons: [{ lessonId: "CIE-01" }] }))).status).toBe(409);
    expect((await POST(request({ ...payload, reason: "x".repeat(64001) }))).status).toBe(413);
    expect(mocks.publish).not.toHaveBeenCalled();
  });
});
