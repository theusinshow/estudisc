import { describe, expect, it } from "vitest";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getServerEnv } from "@/lib/env";

describe("progressive feature flags", () => {
  it("keeps every feature off when missing or blank", () => {
    expect(Object.values(getFeatureFlags({})).every(value => value === false)).toBe(true);
    expect(getFeatureFlags({ FEATURE_NEW_TODAY: "" }).FEATURE_NEW_TODAY).toBe(false);
  });

  it("enables independent explicit flags without serializing unrelated configuration", () => {
    const flags = getFeatureFlags({ FEATURE_STUDY_PLANNER: "true", FEATURE_NEW_TODAY: "false", AUTH_SECRET: "private" });
    expect(flags.FEATURE_STUDY_PLANNER).toBe(true);
    expect(flags.FEATURE_NEW_TODAY).toBe(false);
    expect(flags).not.toHaveProperty("AUTH_SECRET");
    expect(getServerEnv({ FEATURE_INTERACTIVE_LESSONS: "true" }).FEATURE_INTERACTIVE_LESSONS).toBe(true);
  });

  it.each(["yes", "1", "TRUE", " false "])("rejects ambiguous flag configuration: %s", value => {
    expect(() => getFeatureFlags({ FEATURE_REAL_EXAM: value })).toThrow();
    expect(() => getServerEnv({ FEATURE_REAL_EXAM: value })).toThrow();
  });
});
