import { trackPackV2Schema } from "@/features/import/application/track-pack-v2-schema";
import source from "../../packs/seeds/ifsc-2027.golden.track.v2.json";

const src = (color: string) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="${color}"/><path d="M30 80H210" stroke="black" stroke-width="4"/></svg>`).toString("base64")}`;
export const figure = { type: "figure", src: src("#ffdd33"), alt: "Diagrama de fixture com uma linha horizontal", caption: "Antes e depois · fixture", width: 240, height: 160, credit: "Fixture local", longDescription: "Uma linha horizontal liga os dois locais desta figura de validação." };
export const comparison = { ...figure, comparison: { src: src("#90dcff"), alt: "Diagrama de fixture com o fundo alterado", caption: "Depois · fixture", longDescription: "A linha mantém a posição; apenas o fundo muda nesta comparação de validação." } };
export const points = [{ id: "a", label: "Local A", description: "Descrição do local A na fixture.", x: 10, y: 50 }, { id: "b", label: "Local B", description: "Descrição do local B na fixture.", x: 90, y: 50 }];
export const hotspot = { ...figure, type: "hotspot", title: "Explore os pontos", points };
export const map = { ...figure, type: "map", title: "Explore o diagrama de locais", coordinateSystem: "image-percent" as const, points };

export function interactivePack() {
  const input = structuredClone(source);
  input.packId = "estudisc.interactive.fixture"; input.version = 1; input.track.id = "interactive-fixture";
  input.questions.forEach(question => { question.status = "published"; question.exposurePolicy.minimumDaysBetween = 0; });
  input.track.modules.forEach(moduleRecord => moduleRecord.lessons.forEach(lesson => { lesson.status = "draft"; lesson.id += "-pilot"; lesson.activities.forEach(activity => { activity.id += "-pilot"; }); }));
  const lesson = input.track.modules.find(moduleRecord => moduleRecord.subjectCode === "CIE")!.lessons[0];
  lesson.id = "INTERACTIVE-PILOT"; lesson.title = "Interações de validação"; lesson.status = "published";
  const conceptIds = lesson.concepts.map(concept => concept.id);
  const blocks = [
    { id: "pilot-predict", type: "prediction", payload: { title: "Antes de observar", content: "O que muda na figura?", observation: "Observe a comparação da figura a seguir.", explanation: "Compare sua previsão com a mudança de fundo." } },
    { id: "pilot-match", type: "matching", payload: { type: "matching", title: "Relacione os locais", items: [{ id: "a", label: "Primeiro local" }, { id: "b", label: "Segundo local" }], destinations: [{ id: "x", label: "Local A" }, { id: "y", label: "Local B" }], expected: { a: "x", b: "y" }, assistance: { hint: "Leia os dois locais.", recall: "Recorde a correspondência entre os nomes.", analogousExample: "Use um par conhecido como exemplo.", walkthrough: "Primeiro local com A; segundo local com B." }, explanation: "Cada local ocupa um par distinto." } },
    { id: "pilot-timeline", type: "timeline", payload: { type: "ordering", title: "Ordene a sequência", items: [{ id: "b", label: "Depois" }, { id: "a", label: "Antes" }], expectedOrder: ["a", "b"], explanation: "Antes vem primeiro; depois vem em seguida." } },
    { id: "pilot-percent", type: "numeric-explorer", payload: { initialValue: 200, initialPercentage: 15 } },
    { id: "pilot-linear", type: "numeric-explorer", payload: { mode: "linear", title: "Explore o modelo linear", variableLabel: "Entrada", outputLabel: "Resultado", min: 0, max: 10, step: 1, initial: 2, slope: 3, intercept: 1, explanation: "O resultado desta fixture é três vezes a entrada, mais um." } },
    { id: "pilot-comparison", type: "figure", payload: comparison },
    { id: "pilot-hotspot", type: "hotspot", payload: hotspot },
    { id: "pilot-map", type: "map", payload: map }
  ];
  Object.assign(lesson, { blocks: blocks.map(block => ({ ...block, schemaVersion: 1, conceptIds })) });
  return trackPackV2Schema.parse(input);
}
