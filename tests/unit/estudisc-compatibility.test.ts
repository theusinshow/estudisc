import { describe, expect, it } from "vitest";
import { getServerEnv } from "@/lib/env";
import { ACCOUNT_SESSION_COOKIE, LEGACY_ACCOUNT_SESSION_COOKIE, createAccountSession, hashAccessCode, readAccountSessionFromCookies } from "@/features/auth/code-accounts";
import { buildExportPayload } from "@/features/export/export-contracts";
import { previewRestore } from "@/features/restore/restore-contracts";

describe("Estudisc legacy compatibility", () => {
  it("reads legacy configuration into canonical properties and gives explicit Estudisc values priority", () => {
    const old = getServerEnv({ KNOW_OS_OWNER_ID: "owner-old", KNOW_OS_ALLOWED_GOOGLE_EMAILS: "legacy@example.com", KNOW_OS_ACCOUNTS: "legacy-json" });
    expect(old.ESTUDISC_OWNER_ID).toBe("owner-old");
    expect(old.ESTUDISC_ALLOWED_GOOGLE_EMAILS).toEqual(["legacy@example.com"]);
    expect(old.ESTUDISC_ACCOUNTS).toBe("legacy-json");
    expect(old).not.toHaveProperty("KNOW_OS_OWNER_ID");
    const canonical = getServerEnv({ KNOW_OS_OWNER_ID: "old", ESTUDISC_OWNER_ID: "new", KNOW_OS_ALLOWED_GOOGLE_EMAILS: "legacy@example.com", ESTUDISC_ALLOWED_GOOGLE_EMAILS: "", KNOW_OS_ACCOUNTS: "legacy", ESTUDISC_ACCOUNTS: "" });
    expect(canonical.ESTUDISC_OWNER_ID).toBe("new");
    expect(canonical.ESTUDISC_ALLOWED_GOOGLE_EMAILS).toEqual([]);
    expect(canonical.ESTUDISC_ACCOUNTS).toBeUndefined();
    expect(getServerEnv({ AUTH_TRUST_HOST: "false" }).AUTH_TRUST_HOST).toBe(false);
    expect(getServerEnv({ AUTH_TRUST_HOST: "true" }).AUTH_TRUST_HOST).toBe(true);
  });
  it("reads signed legacy cookies without changing signatures and writes the canonical cookie", () => {
    const account = { id: "legacy-owner", name: "Owner", role: "ADMIN" as const, code: hashAccessCode("123456") };
    const secret = "test-only-migration-secret";
    const token = createAccountSession(account, secret);
    const cookies = { get: (name: string) => name === LEGACY_ACCOUNT_SESSION_COOKIE ? { value: token } : undefined };
    expect(ACCOUNT_SESSION_COOKIE).toBe("estudisc_session");
    expect(readAccountSessionFromCookies(cookies, [account], secret)?.id).toBe(account.id);
    expect(readAccountSessionFromCookies(cookies, [account], "wrong-secret")).toBeNull();
  });
  it("accepts a genuine legacy export envelope while new export/preview identifiers use Estudisc", () => {
    const payload = { packManifests: [], tracks: [], knowledgeMap: [], masteryEvidence: [], recentAttempts: [], dueReviews: [], mistakes: [], projects: [], xpSummary: { totalXp: 0, transactions: [] }, events: [], gamification: { badgeAwards: [], missionProgress: [], missionEvents: [] } };
    const legacy = { schema: "know-os.export.v1", kind: "backup", exportedAt: "2026-10-06T00:00:00Z", privacy: { warnings: [], includesPrivateSourceCode: false, includesProjectContext: false }, payload };
    expect(previewRestore(legacy)).toMatchObject({ status: "ready", schema: "estudisc.restore-preview.v1" });
    expect(previewRestore({ ...legacy, schema: "estudisc.export.v1" })).toMatchObject({ status: "ready" });
    expect(buildExportPayload({ kind: "backup", snapshot: payload, exportedAt: new Date("2026-10-06T00:00:00Z") }).schema).toBe("estudisc.export.v1");
  });
});
