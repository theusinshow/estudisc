import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateTrackPack } from "@/features/import/api";
// @ts-expect-error plain ESM authoring script without type declarations
import { WEEK_PACK_PATH, buildWeekPack } from "../../scripts/build-ifsc-week-pack.mjs";

describe("Week 1 release pack", () => {
  it("is in sync with the draft sources and still entirely draft", () => {
    const committed = JSON.parse(readFileSync(WEEK_PACK_PATH, "utf8"));
    expect(committed, "Run: node scripts/build-ifsc-week-pack.mjs").toEqual(buildWeekPack());
    expect(validateTrackPack(committed).ok).toBe(true);
    const lessons = committed.track.modules.flatMap((entry: { lessons: { status: string }[] }) => entry.lessons);
    expect(lessons.every((lesson: { status: string }) => lesson.status === "draft")).toBe(true);
    expect(committed.questions.every((question: { status: string }) => question.status === "draft")).toBe(true);
  });
});
