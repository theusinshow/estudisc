import { z } from "zod";

const id = z.string().min(1).max(160);
const target = { target: z.enum(["block", "activity"]), id };
const text = z.string().max(2000);
const response = z.union([text, z.array(id).max(100), z.record(id, text)]);
export const interactionStateSchema = z.discriminatedUnion("kind", [
  z.object({ ...target, kind: z.literal("educational"), state: z.object({ response, helpLevel: z.number().int().min(0).max(4), checked: z.boolean() }).strict() }).strict(),
  z.object({ ...target, kind: z.literal("prediction"), state: z.object({ response: text, phase: z.enum(["predict", "observe", "explain"]) }).strict() }).strict(),
  z.object({ ...target, kind: z.literal("numeric-explorer"), state: z.object({ base: z.string().max(64), percentage: z.string().max(64) }).strict() }).strict(),
  z.object({ ...target, kind: z.literal("linear-explorer"), state: z.object({ input: z.string().max(64) }).strict() }).strict(),
  z.object({ ...target, kind: z.literal("atom"), state: z.object({ protons: z.string().max(64), neutrons: z.string().max(64), electrons: z.string().max(64), prediction: z.string().max(64), revealed: z.boolean() }).strict() }).strict(),
  z.object({ ...target, kind: z.literal("comparison"), state: z.object({ position: z.number().int().min(0).max(100) }).strict() }).strict(),
  z.object({ ...target, kind: z.literal("hotspot"), state: z.object({ selectedId: id.nullable(), zoom: z.number().min(1).max(3).multipleOf(0.25) }).strict() }).strict(),
  z.object({ ...target, kind: z.literal("map"), state: z.object({ selectedId: id.nullable() }).strict() }).strict()
]);
export type InteractionState = z.infer<typeof interactionStateSchema>;
export type InteractionKind = InteractionState["kind"];
export type InteractionTarget = { target: "block" | "activity"; id: string };
export type StateFor<K extends InteractionKind> = Extract<InteractionState, { kind: K }>["state"];
export const interactionKey = (ref: InteractionTarget) => JSON.stringify([ref.target, ref.id]);
