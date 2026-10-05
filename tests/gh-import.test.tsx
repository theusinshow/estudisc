import { expect, it } from "vitest";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ALL, PACK, PILOT, OUTPUT, buildGhPack, ghPackSchema, loadGh, runtimeId, sourcePins } from "../tools/gh-import/mapper";
import { readJson } from "../tools/science-import/mapper";
import { hashCanonicalJson } from "@/lib/canonical-json";
import { LessonBlockList } from "@/features/lessons/blocks";
import { QuestionPanel } from "@/features/activities/components/question-panel";
import { studentQuestion } from "@/features/questions/student-view";
import { evaluateQuestion, canExposeQuestion } from "@/features/questions/api";
import { trackPackV2Schema } from "@/features/import/api";

const candidate = process.env.GH_QA_PACK ?? PACK;
it("retains GH source bytes, mappings, strict schemas and semantic identity", () => {
  const gh = loadGh();
  expect(gh.originals).toHaveLength(49); expect(gh.conceptMap.entries).toHaveLength(293);
  expect(gh.conceptMap.entries.filter(e => e.disposition === "existing")).toHaveLength(3);
  expect(gh.authentic).toHaveLength(42); expect(gh.deterministic).toHaveLength(29); expect(gh.illustrations).toHaveLength(6);
  expect(() => ghPackSchema.parse({ ...gh.originals[0].pack, extra: true })).toThrow();
  expect(() => ghPackSchema.parse({ ...gh.originals[0].pack, lesson: { ...gh.originals[0].pack.lesson, blocks: [{ ...gh.originals[0].pack.lesson.blocks[0], type: "UNSUPPORTED" }] } })).toThrow();
  for (const mutate of [
    (p: typeof gh.originals[0]["pack"]) => { p.questions[0].options[0].key = "B"; },
    (p: typeof gh.originals[0]["pack"]) => { p.questions[0].correctOption = "Z"; },
    (p: typeof gh.originals[0]["pack"]) => { p.questions[0].conceptIds = ["UNKNOWN"]; }
  ]) { const invalid = structuredClone(gh.originals[0].pack); mutate(invalid); expect(() => ghPackSchema.parse(invalid)).toThrow(); }
  expect(runtimeId("GH-02")).toBe("GH-V2-02");
  expect(ALL.map(runtimeId)).not.toContain("GH-02");
  const baseline = readJson("packs/drafts/ifsc-2027-gh/source-baseline.json");
  expect(sourcePins()).toEqual(baseline);
  const serialized = readFileSync(candidate, "utf8");
  const pack = trackPackV2Schema.parse(JSON.parse(serialized));
  const ids = pack.track.modules.flatMap(m => m.lessons.map(l => l.id.replace(/^GH-V2-/, "GH-")));
  expect(buildGhPack(ids, pack.version).pack).toEqual(pack);
  expect(pack.sources.every(s => !s.locator.url && s.metadata.documentaryEmbeddingAllowed === false)).toBe(true);
  expect(serialized).not.toMatch(/data:image|<iframe|<img/);
});

it("renders unchanged GH text and Questions with core evaluators, without exposing drafts", () => {
  const pack = trackPackV2Schema.parse(readJson(candidate)); const gh = loadGh();
  for (const lesson of pack.track.modules.flatMap(m => m.lessons)) {
    const original = gh.originals.find(r => runtimeId(r.lessonId) === lesson.id)!.pack;
    expect(lesson.blocks.map(b => b.id)).toEqual(original.lesson.blocks.map(b => runtimeId(b.id)));
    const html = renderToStaticMarkup(<LessonBlockList blocks={lesson.blocks.map(b => ({ stableId: b.id, type: b.type, payload: b.payload }))}/>);
    const document = new DOMParser().parseFromString(html, "text/html");
    const text = document.body.textContent!;
    expect(text).not.toMatch(/Bloco inválido|Conteúdo inválido|ainda não possui renderer aprovado/i);
    for (const block of original.lesson.blocks) {
      const guide = typeof block.answerGuide === "string" ? [block.answerGuide] : block.answerGuide?.mustMention ?? [];
      const reasoning = Array.isArray(block.reasoning) ? block.reasoning : [block.reasoning];
      for (const value of [block.title, block.content, ...(block.items ?? []), block.prompt, block.answer, ...reasoning, ...guide].filter((v): v is string => !!v)) expect(text, block.id).toContain(value);
      expect(lesson.blocks.find(b => b.id === runtimeId(block.id))).toBeDefined();
    }
    for (const originalQuestion of original.questions) {
      const q = pack.questions.find(q => q.id === runtimeId(originalQuestion.id))!;
      expect(q.stem).toBe(originalQuestion.stem); expect(q.explanation).toBe(originalQuestion.explanation);
      expect(q.choices).toEqual(originalQuestion.options.map(o => ({ id: o.key, content: o.text, correct: o.key === originalQuestion.correctOption })));
      expect(q.answer).toEqual({ kind: "multiple_choice", choiceId: originalQuestion.correctOption });
      expect(q.status).toBe("draft"); expect(q.provenance.type).toBe("generated");
      expect(q.conceptIds).toEqual(originalQuestion.conceptIds.map(id => gh.conceptMap.entries.find(e => e.editorialId === id)!.canonicalId));
      for (const choice of q.choices!) expect(evaluateQuestion(q, choice.id)).toMatchObject({ correct: choice.correct, evidenceEligible: true });
      for (const context of ["training", "review", "assessment"] as const) expect(canExposeQuestion(q, { now: new Date("2026-10-05"), context })).toBe(false);
      const student = studentQuestion(q); expect(student).not.toHaveProperty("answer");
      const html = renderToStaticMarkup(<QuestionPanel question={student} activityStableId={`${q.id}-ACT`}/>);
      const rendered = new DOMParser().parseFromString(html, "text/html");
      expect(rendered.querySelectorAll('input[type="radio"]')).toHaveLength(5);
      expect(rendered.body.textContent).toContain(q.stem);
      for (const option of originalQuestion.options) expect(rendered.body.textContent).toContain(option.text);
    }
  }
  if (pack.version === 1) {
    expect(pack.track.modules.flatMap(m => m.lessons.map(l => l.id)).sort()).toEqual(PILOT.map(runtimeId).sort());
    mkdirSync(OUTPUT, { recursive: true });
    writeFileSync(`${OUTPUT}/pilot-core-qa.json`, JSON.stringify({ passed: true, contentHash: hashCanonicalJson(pack) }));
  }
});
