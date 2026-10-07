import { expect, it } from "vitest";
import { interactionKey, interactionStateSchema } from "@/features/lessons/interaction-state";
import { validInteractionState } from "@/features/lessons/interaction-policy";
import { emptyResume, resumeDataSchema } from "@/features/lessons/resume-contracts";
import { hashCanonicalJson } from "@/lib/canonical-json";

const source = { target: "block" as const, id: "match", type: "matching", config: { items: [{ id: "a", label: "A" }, { id: "b", label: "B" }], destinations: [{ id: "x", label: "X" }, { id: "y", label: "Y" }], expected: { a: "x", b: "y" }, hints: ["Pense nas relações"] } };
const saved = { target: "block" as const, id: "match", kind: "educational" as const, state: { response: { a: "y", b: "y" }, helpLevel: 1, checked: true } };
it("preserves legacy payload bytes/hash and distinguishes block/activity identities", () => {
  const legacy = emptyResume(), parsed = resumeDataSchema.parse(legacy);
  expect(Object.hasOwn(parsed, "interactions")).toBe(false);
  expect(hashCanonicalJson(parsed)).toBe(hashCanonicalJson(legacy));
  expect(interactionKey({ target: "block", id: "x" })).not.toBe(interactionKey({ target: "activity", id: "x" }));
});
it("keeps wrong-but-valid practice responses and rejects unrelated membership, kinds and help", () => {
  expect(validInteractionState(source, saved)).toBe(true);
  expect(validInteractionState(source, { ...saved, target: "activity" })).toBe(false);
  expect(validInteractionState(source, { ...saved, state: { ...saved.state, response: { a: "outside" } } })).toBe(false);
  expect(validInteractionState(source, { ...saved, state: { ...saved.state, helpLevel: 4 } })).toBe(false);
  expect(validInteractionState(source, { ...saved, kind: "prediction", state: { response: "x", phase: "observe" } })).toBe(false);
});
it("requires an ordering permutation and bounds state without accepting synthetic grades", () => {
  const order = { target: "block" as const, id: "match", type: "timeline", config: { items: source.config.items, expectedOrder: ["a", "b"] } };
  expect(validInteractionState(order, { ...saved, state: { ...saved.state, response: ["b", "a"], helpLevel: 0 } })).toBe(true);
  expect(validInteractionState(order, { ...saved, state: { ...saved.state, response: ["a", "a"], helpLevel: 0 } })).toBe(false);
  expect(() => interactionStateSchema.parse({ ...saved, state: { ...saved.state, mastery: 5 } })).toThrow();
  expect(() => resumeDataSchema.parse({ ...emptyResume(), interactions: [saved, saved] })).toThrow();
});
