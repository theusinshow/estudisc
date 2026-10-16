import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError } from "@/features/auth/owner";
import { POST } from "@/app/api/admin/standalone-questions/route";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), importSet: vi.fn(), publish: vi.fn(), constructed: vi.fn() }));
vi.mock("@/features/auth/owner", async importOriginal => ({
  ...await importOriginal<typeof import("@/features/auth/owner")>(), requireAdmin: mocks.requireAdmin
}));
vi.mock("@/db/repositories/content-qa/standalone-question-repository", () => ({
  StandaloneQuestionRepository: class { constructor() { mocks.constructed(); } importSet = mocks.importSet; }
}));
vi.mock("@/db/repositories/content-qa/publication-service", () => ({
  ContentPublicationService: class { constructor() { mocks.constructed(); } publishStandaloneQuestionsDirect = mocks.publish; }
}));
const request = (body: unknown) => new Request("http://localhost/api/admin/standalone-questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const admin = { ownerId: "admin", role: "ADMIN" };

describe("standalone Questions admin API", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requireAdmin.mockResolvedValue(admin); });
  it("imports and publishes with the authenticated ADMIN identity", async () => {
    mocks.importSet.mockResolvedValue({ imported: 1, unchanged: 0, releases: [] });
    mocks.publish.mockResolvedValue({ published: true, releases: 1, newlyPublished: 1 });
    expect((await POST(request({ action: "import", trackId: "t", questions: [{ id: "SIM-1" }] }))).status).toBe(200);
    expect(mocks.importSet).toHaveBeenCalledWith(admin, { trackId: "t", questions: [{ id: "SIM-1" }] });
    const reason = "Publicação direta das questões inéditas.";
    expect(await (await POST(request({ action: "publish_direct", questions: [{ id: "SIM-1", version: 1 }], reason }))).json()).toMatchObject({ newlyPublished: 1 });
    expect(mocks.publish).toHaveBeenCalledWith(admin, { questions: [{ id: "SIM-1", version: 1 }], reason });
  });
  it("denies non-admins before touching repositories and blocks unknown actions", async () => {
    mocks.requireAdmin.mockRejectedValue(new AccessDeniedError());
    expect((await POST(request({ action: "import", trackId: "t", questions: [] }))).status).toBe(403);
    expect(mocks.constructed).not.toHaveBeenCalled();
    mocks.requireAdmin.mockResolvedValue(admin);
    expect((await POST(request({ action: "delete" }))).status).toBe(409);
    mocks.importSet.mockRejectedValue(new Error("Immutable content conflict: SIM-1 v1"));
    expect(await (await POST(request({ action: "import", trackId: "t", questions: [] }))).json()).toMatchObject({ code: "standalone_action_blocked", message: "Immutable content conflict: SIM-1 v1" });
  });
});
