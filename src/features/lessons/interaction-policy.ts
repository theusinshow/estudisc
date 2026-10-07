import { educationalActivitySchema, type EducationalActivityConfig } from "@/features/activities/application/educational-activity";
import { parseStaticActivityConfig } from "@/features/activities/application/static-activity-config";
import { atomModelSchema } from "./blocks/atom-model-schema";
import { numericExplorerSchema } from "./blocks/numeric-explorer-schema";
import { figureBlockSchema, titledTextBlockSchema } from "./blocks/block-schemas";
import { hotspotSchema, authoredMapSchema } from "./blocks/visual-interactions-schema";
import type { InteractionState, InteractionTarget } from "./interaction-state";

export type InteractionSource = InteractionTarget & { type: string; config: unknown };
const record = (input: unknown): Record<string, unknown> => typeof input === "object" && input !== null && !Array.isArray(input) ? input as Record<string, unknown> : {};
const educationalTypes = new Set(["numeric", "ordering", "classification", "matching", "text-highlight", "guided-steps"]);
export function exploratoryHelp(config: EducationalActivityConfig) {
  return config.assistance ? [{ label: "Dica", text: config.assistance.hint }, { label: "Recordar o conceito", text: config.assistance.recall }, { label: "Exemplo semelhante", text: config.assistance.analogousExample }, { label: "Passo a passo", text: config.assistance.walkthrough }] : config.hints.map((text, index) => ({ label: `Dica ${index + 1}`, text }));
}
export function validEducationalResponse(config: EducationalActivityConfig, response: unknown) {
  if (config.type === "numeric") return typeof response === "string";
  if (config.type === "multiple-choice") return typeof response === "string" && (response === "" || config.items.some(item => item.id === response));
  if (config.type === "ordering") return Array.isArray(response) && response.length === config.items.length && new Set(response).size === config.items.length && response.every(id => config.items.some(item => item.id === id));
  if (config.type === "text-highlight") return Array.isArray(response) && new Set(response).size === response.length && response.every(id => config.items.some(item => item.id === id));
  if (!response || typeof response !== "object" || Array.isArray(response)) return false;
  const entries = Object.entries(response);
  if (config.type === "guided-steps") return entries.every(([id, value]) => config.steps.some(step => step.id === id) && typeof value === "string");
  return entries.every(([id, value]) => config.items.some(item => item.id === id) && typeof value === "string" && (value === "" || config.destinations.some(destination => destination.id === value)));
}
export function validInteractionState(source: InteractionSource, interaction: InteractionState) {
  if (source.target !== interaction.target || source.id !== interaction.id) return false;
  const payload = record(source.config);
  if (educationalTypes.has(source.type) || source.type === "timeline") {
    const parsed = educationalActivitySchema.safeParse({ ...payload, type: source.type === "timeline" ? "ordering" : source.type });
    return parsed.success && interaction.kind === "educational" && validEducationalResponse(parsed.data, interaction.state.response) && interaction.state.helpLevel <= exploratoryHelp(parsed.data).length;
  }
  if (source.type === "prediction") {
    if (interaction.kind !== "prediction" || interaction.state.phase !== "predict" && !interaction.state.response.trim()) return false;
    if (source.target === "block") return titledTextBlockSchema.safeParse({ ...payload, type: "prediction" }).success;
    const config = parseStaticActivityConfig(source.config);
    return !config.choices.length || interaction.state.response === "" || /^(0|[1-9]\d*)$/.test(interaction.state.response) && Number(interaction.state.response) < config.choices.length;
  }
  if (source.type === "numeric-explorer") {
    const parsed = numericExplorerSchema.safeParse(source.config);
    return parsed.success && interaction.kind === (parsed.data.mode === "linear" ? "linear-explorer" : "numeric-explorer");
  }
  if (source.type === "diagram") {
    if (interaction.kind !== "atom" || !atomModelSchema.safeParse(source.config).success) return false;
    const state = interaction.state;
    return !state.revealed || [state.protons, state.neutrons, state.electrons].every(value => value.trim() !== "") && atomModelSchema.safeParse({ kind: "atom", protons: Number(state.protons), neutrons: Number(state.neutrons), electrons: Number(state.electrons) }).success;
  }
  if (source.type === "figure") return interaction.kind === "comparison" && Boolean(figureBlockSchema.safeParse({ type: "figure", ...payload }).data?.comparison);
  if (source.type === "hotspot" || source.type === "map") {
    const parsed = (source.type === "hotspot" ? hotspotSchema : authoredMapSchema).safeParse({ type: source.type, ...payload });
    return parsed.success && interaction.kind === source.type && (interaction.state.selectedId === null || parsed.data.points.some(point => point.id === interaction.state.selectedId));
  }
  return false;
}
