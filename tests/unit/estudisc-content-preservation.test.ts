// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import baseline from "../fixtures/estudisc-content-baseline.json";
import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";

it("preserves all 132 production lesson identities, 1144 Questions and original Pack bytes through the rename", () => {
  const lessons: string[] = [], questions: string[] = [];
  for (const entry of baseline) {
    const bytes = readFileSync(entry.path);
    expect(createHash("sha256").update(bytes).digest("hex"), entry.path).toBe(entry.sha256);
    const pack = trackPackV2Schema.parse(JSON.parse(bytes.toString("utf8")));
    const lessonIds = pack.track.modules.flatMap(module => module.lessons.map(lesson => lesson.id));
    const questionIds = pack.questions.map(question => question.id);
    expect(pack.packId).toBe(entry.packId);
    expect(pack.version).toBe(entry.version);
    expect(lessonIds).toEqual(entry.lessonIds);
    expect(questionIds).toEqual(entry.questionIds);
    lessons.push(...lessonIds); questions.push(...questionIds);
  }
  expect(lessons).toHaveLength(132);
  expect(new Set(lessons).size).toBe(132);
  expect(questions).toHaveLength(1144);
  expect(new Set(questions).size).toBe(1144);
});
