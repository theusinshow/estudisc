import { describe, expect, it } from "vitest";
import config from "../../scripts/validate-packs.config.json";
// @ts-expect-error -- plain ESM script without type declarations
import { applyBaseline, validateAcrossPacks, validatePack } from "../../scripts/validate-packs.mjs";

type Choice = { id: string; content: string; correct: boolean };
type Violation = { rule: string; id: string; value?: number; file?: string };
const letters = ["A", "B", "C", "D", "E"];

/** Balanced, clean question: equal-length choices, no absolute terms, rotating answer letter. */
function question(index: number, patch: Record<string, unknown> = {}) {
  const answer = letters[index % 5];
  const choices: Choice[] = letters.map(id => ({ id, content: `Opção ${id} da questão ${index}`, correct: id === answer }));
  return { id: `Q-${index}`, stem: `Enunciado número ${index}?`, choices, answer: { kind: "multiple_choice", choiceId: answer }, explanation: "Explicação.", assets: [] as unknown[], ...patch };
}
function pack(questions: ReturnType<typeof question>[], content = "Texto didático limpo.", packId = "pack-a", lessonId = "L-01", title = "Aula") {
  return { schema: "caderno.track.v2", packId, questions, track: { modules: [{ lessons: [{ id: lessonId, title, blocks: [{ id: "B1", payload: { content, caption: "Legenda clara." } }] }] }] } };
}
const clean = () => Array.from({ length: 25 }, (_, index) => question(index));
const rules = (violations: Violation[]) => [...new Set(violations.map(violation => violation.rule))].sort();

describe("validate-packs rules", () => {
  it("passes a clean pack", () => {
    expect(validatePack(pack(clean()), config)).toEqual([]);
  });

  it("R1 flags editorial text but not legitimate words such as 'independentes' or 'recorte do espaço'", () => {
    expect(rules(validatePack(pack(clean(), "Ilustração pendente: IMG-CIE-02-001."), config))).toEqual(["R1"]);
    expect(validatePack(pack(clean(), "Regiões independentes num recorte do espaço."), config)).toEqual([]);
  });

  it("R2 flags an English enum alone on a line", () => {
    expect(rules(validatePack(pack(clean(), "Todo texto é um conto.\n\nINCORRECT\n\nExplique."), config))).toEqual(["R2"]);
    expect(validatePack(pack(clean(), "A afirmação é INCORRECTA? Não."), config)).toEqual([]);
  });

  it("R3 flags packs where the correct choice is usually the longest", () => {
    const longest = clean().map(entry => ({ ...entry, choices: entry.choices.map(choice => choice.correct ? { ...choice, content: `${choice.content} e muito mais longa` } : choice) }));
    expect(rules(validatePack(pack(longest), config))).toEqual(["R3"]);
  });

  it("R4 warns when many distractors use absolute terms", () => {
    const absolute = clean().map(entry => ({ ...entry, choices: entry.choices.map(choice => choice.correct ? choice : { ...choice, content: `Sempre ${choice.content}` }) }));
    const found = validatePack(pack(absolute), config);
    expect(rules(found)).toEqual(["R4"]);
    expect(config.rules.R4.severity).toBe("warn");
  });

  it("R5 flags an unbalanced answer key", () => {
    const allA = clean().map(entry => ({ ...entry, choices: entry.choices.map(choice => ({ ...choice, correct: choice.id === "A" })), answer: { kind: "multiple_choice", choiceId: "A" } }));
    expect(rules(validatePack(pack(allA), config))).toEqual(["R5"]);
  });

  it("R6 flags answer.choiceId that disagrees with the correct choice", () => {
    const broken = clean(); broken[0] = { ...broken[0], answer: { kind: "multiple_choice", choiceId: "E" } };
    const found = validatePack(pack(broken), config).filter((violation: Violation) => violation.rule === "R6");
    expect(found.map((violation: Violation) => violation.id)).toEqual(["Q-0"]);
  });

  it("R8 flags an identical stem without stimulus, unless the question has an asset", () => {
    const repeated = clean(); repeated[1] = { ...repeated[1], stem: repeated[0].stem };
    expect(validatePack(pack(repeated), config).filter((violation: Violation) => violation.rule === "R8")).toHaveLength(2);
    repeated[1] = { ...repeated[1], assets: [{ id: "map" }] };
    expect(validatePack(pack(repeated), config).filter((violation: Violation) => violation.rule === "R8")).toEqual([]);
  });

  it("R7 flags ids reused by another pack but not a copy of the same pack", () => {
    const a = { file: "drafts/a.pack.json", pack: pack(clean(), "x", "pack-a", "CIE-06", "Circuitos") };
    const copy = { file: "releases/a.pack.json", pack: pack(clean(), "x", "pack-a", "CIE-06", "Circuitos") };
    expect(validateAcrossPacks([a, copy])).toEqual([]);
    const other = { file: "releases/w1.pack.json", pack: pack([question(99)], "x", "week-1", "CIE-06", "Estrutura atômica") };
    const found = validateAcrossPacks([a, other]);
    expect(found.map((violation: Violation) => violation.id)).toEqual(["lesson:CIE-06", "lesson:CIE-06"]);
    expect(found[0].detail).toContain("different title");
  });
});

describe("validate-packs baseline", () => {
  const raw = [{ file: "p.json", rule: "R1", id: "L/B1" }, { file: "p.json", rule: "R3", id: "*", value: 0.6 }, { file: "p.json", rule: "R1", id: "L/B2" }];
  const baseline = { entries: [{ file: "p.json", rule: "R1", id: "L/B1" }, { file: "p.json", rule: "R3", id: "*", value: 0.6 }] };

  it("downgrades known problems to warn and keeps new ones as errors", () => {
    expect(applyBaseline(raw, baseline, config).map((violation: Violation & { severity: string }) => violation.severity)).toEqual(["warn", "warn", "error"]);
  });

  it("fails again when an aggregate rule gets worse than its baseline", () => {
    const worse = applyBaseline([{ file: "p.json", rule: "R3", id: "*", value: 0.7 }], baseline, config)[0];
    expect(worse.severity).toBe("error"); expect(worse.regressed).toBe(true);
  });
});

describe("validate-packs templating rules", () => {
  it("R9 flags a choice reused across many questions", () => {
    const boiler = clean().map((entry, index) => ({ ...entry, choices: entry.choices.map(choice => choice.correct || choice.id !== letters[(index + 1) % 5] ? choice : { ...choice, content: "A leitura toma a palavra isolada como pista" }) }));
    expect(validatePack(pack(boiler), config).some((violation: Violation) => violation.rule === "R9")).toBe(true);
  });

  it("R10 flags templated stem openings", () => {
    const templated = clean().map(entry => ({ ...entry, stem: `Como o contexto esclarece ${entry.id}?` }));
    expect(validatePack(pack(templated), config).some((violation: Violation) => violation.rule === "R10")).toBe(true);
  });

  it("R11 flags identical choice sets that always share the same answer", () => {
    const set = ["I e III", "I", "II e IV", "I, II e III", "I, II, III e IV"];
    const predictable = clean().slice(0, 6).map((entry, index) => ({ ...entry, stem: `Proposições sobre tema ${index}?`, choices: set.map((content, i) => ({ id: letters[i], content, correct: i === 0 })), answer: { kind: "multiple_choice", choiceId: "A" } }));
    expect(validatePack(pack(predictable), config).filter((violation: Violation) => violation.rule === "R11")).toHaveLength(1);
    const varied = predictable.map((entry, index) => ({ ...entry, choices: entry.choices.map((choice, i) => ({ ...choice, correct: i === index % 5 })), answer: { kind: "multiple_choice", choiceId: letters[index % 5] } }));
    expect(validatePack(pack(varied), config).filter((violation: Violation) => violation.rule === "R11")).toHaveLength(0);
  });
});
