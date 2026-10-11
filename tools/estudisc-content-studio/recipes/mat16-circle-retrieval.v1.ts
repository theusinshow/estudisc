import { buildAssessedEnrichmentPacket, type AuthoringContext } from "@/features/content-qa/authoring-contracts";

const circleLength = "MAT.MEASURE.LENGTH";
const circleArea = "MAT.GEO.AREA.OTHER_PLANAR";

/** Original generated training items. Standard formulas are not copied from a
 * protected exam/source; the retained lesson still displays its source/rights
 * and official-mapping caveats. */
export function buildMat16CircleRetrievalPacket(context: AuthoringContext, packetId: string) {
  if (context.lesson.id !== "MAT-16" || context.lesson.version !== 4 || !context.published) throw new Error("MAT-16 v4 published authoring context required");
  const conceptIds = new Set(context.lesson.concepts.map(concept => concept.id));
  if (!conceptIds.has(circleLength) || !conceptIds.has(circleArea)) throw new Error("MAT-16 circle Concepts changed; do not generate a stale packet");
  const questions = [
    { id: "Q-MAT-16-CIRCLE-CIRCUMFERENCE-R5-V1", version: 1, subjectCode: "MAT", primaryConceptId: circleLength, conceptIds: [circleLength], type: "numeric" as const, difficulty: "direct" as const, cognitiveOperations: ["calculate" as const], stem: "Usando π aproximadamente 3,14, qual é o comprimento de uma circunferência de raio 5 cm?", answer: { kind: "numeric" as const, value: 31.4, tolerance: 0.01, unit: "cm" }, explanation: "Use C = 2πr: 2 × 3,14 × 5 = 31,4 cm.", sourceIds: [], assets: [], items: [], destinations: [], provenance: { type: "generated" as const, generationRunId: "mat16-circle-retrieval-v1" }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft" as const },
    { id: "Q-MAT-16-CIRCLE-RADIUS-FROM-C62-8-V1", version: 1, subjectCode: "MAT", primaryConceptId: circleLength, conceptIds: [circleLength], type: "numeric" as const, difficulty: "direct" as const, cognitiveOperations: ["calculate" as const], stem: "Uma circunferência mede 62,8 cm. Usando π aproximadamente 3,14, qual é o raio, em cm?", answer: { kind: "numeric" as const, value: 10, tolerance: 0, unit: "cm" }, explanation: "Como C = 2πr, r = 62,8 ÷ (2 × 3,14) = 10 cm.", sourceIds: [], assets: [], items: [], destinations: [], provenance: { type: "generated" as const, generationRunId: "mat16-circle-retrieval-v1" }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft" as const },
    { id: "Q-MAT-16-CIRCLE-AREA-R3-V1", version: 1, subjectCode: "MAT", primaryConceptId: circleArea, conceptIds: [circleArea], type: "numeric" as const, difficulty: "direct" as const, cognitiveOperations: ["calculate" as const], stem: "Usando π aproximadamente 3,14, qual é a área de um círculo de raio 3 cm?", answer: { kind: "numeric" as const, value: 28.26, tolerance: 0.01, unit: "cm²" }, explanation: "Use A = πr²: 3,14 × 3² = 28,26 cm².", sourceIds: [], assets: [], items: [], destinations: [], provenance: { type: "generated" as const, generationRunId: "mat16-circle-retrieval-v1" }, exposurePolicy: { minimumDaysBetween: 0, reservedForAssessment: false }, status: "draft" as const }
  ];
  return buildAssessedEnrichmentPacket(context, questions, [
    { id: "ACT-MAT-16-CIRCLE-CIRCUMFERENCE-R5-V1", type: "question", conceptIds: [circleLength], prompt: "Recupere a fórmula e calcule o comprimento.", questionId: questions[0].id, config: { hints: ["Comece por C = 2πr."] } },
    { id: "ACT-MAT-16-CIRCLE-RADIUS-FROM-C62-8-V1", type: "question", conceptIds: [circleLength], prompt: "Isole o raio na fórmula da circunferência.", questionId: questions[1].id, config: { hints: ["Divida o comprimento por 2π."] } },
    { id: "ACT-MAT-16-CIRCLE-AREA-R3-V1", type: "question", conceptIds: [circleArea], prompt: "Diferencie a área do comprimento e calcule a área.", questionId: questions[2].id, config: { hints: ["A área usa o raio ao quadrado."] } }
  ], packetId);
}
