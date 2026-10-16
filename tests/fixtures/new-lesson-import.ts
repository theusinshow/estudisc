import { newLessonPackFromAuthoring, type NewLessonAuthoring } from "../../tools/estudisc-content-studio/new-lesson-from-authoring";
import { lessonVersionFixture } from "./lesson-version-import";

const choices = (correct: string, label: string) => ["A", "B", "C", "D"].map(id => ({ id, content: `Alternativa ${id} de ${label}`, correct: id === correct,
  targetsError: id === correct ? null : id === "A" ? "calculation" : "soma por média", rationale: id === correct ? "Correta pelo cálculo indicado." : "Confere o passo omitido." }));

/** Synthetic authored lesson (disposable fixture, not real content): two Concepts, text blocks, three Questions. */
export function newLessonAuthoringFixture(): NewLessonAuthoring {
  return {
    lessonId: "MAT-NEW-FIX", title: "Aula nova de teste", subject: "MAT", estimatedMinutes: 30, editalItem: "MATEMÁTICA — item fictício de teste",
    objectives: ["Calcular uma média simples.", "Escolher a medida adequada."],
    concepts: [{ id: "MAT-NEW-FIX-C01", title: "Média simples", summary: "Soma dividida pela quantidade." }, { id: "MAT-NEW-FIX-C02", title: "Mediana", summary: "Valor central da lista ordenada." }],
    blocks: [
      { id: "MAT-NEW-FIX-B01", type: "note", title: "Por que isso importa?", content: "Médias resumem dados do cotidiano.", conceptIds: ["MAT-NEW-FIX-C01"] },
      { id: "MAT-NEW-FIX-B02", type: "concept", title: "Média simples", content: "Some os valores e divida pela quantidade.", conceptIds: ["MAT-NEW-FIX-C01"] },
      { id: "MAT-NEW-FIX-B03", type: "concept", title: "Mediana", content: "Ordene a lista e tome o valor central.", conceptIds: ["MAT-NEW-FIX-C02"] },
      { id: "MAT-NEW-FIX-B04", type: "worked-example", title: "Exemplo", content: "8 + 12 = 20; 20 ÷ 2 = 10.", conceptIds: ["MAT-NEW-FIX-C01"] },
      { id: "MAT-NEW-FIX-B05", type: "summary", content: "Média soma e divide; mediana ordena.", conceptIds: ["MAT-NEW-FIX-C01", "MAT-NEW-FIX-C02"] }
    ],
    questions: [
      { id: "MAT-NEW-FIX-Q01", difficulty: "foundation", conceptIds: ["MAT-NEW-FIX-C01"], stimulus: "Tempos: 8, 12, 10 e 14 minutos.", stem: "Qual é a média?", choices: choices("B", "Q01"), explanation: "44 ÷ 4 = 11." },
      { id: "MAT-NEW-FIX-Q02", difficulty: "direct", conceptIds: ["MAT-NEW-FIX-C02"], stimulus: null, stem: "Qual é a mediana de 3, 9 e 5?", choices: choices("C", "Q02"), explanation: "Ordenada: 3, 5, 9; mediana 5." },
      { id: "MAT-NEW-FIX-Q03", difficulty: "ifsc", conceptIds: ["MAT-NEW-FIX-C02", "MAT-NEW-FIX-C01"], stimulus: "Salários: 2, 2, 3 e 30 mil.", stem: "Qual medida resume melhor o grupo?", choices: choices("D", "Q03"), explanation: "O extremo distorce a média; a mediana resiste." }
    ],
    exitTicketQuestionIds: ["MAT-NEW-FIX-Q03"],
    sources: [{ title: "Referência fictícia de teste", author: "Fixture", url: "https://example.org/medidas", accessedAt: "2026-10-16", usage: "conferência de fatos" }]
  };
}

/** The lesson-version fixture context (Track `targeted-version-fixture`, module `mat`) plus a converted new-lesson pack. */
export function newLessonFixture(published = false) {
  const { context, base } = lessonVersionFixture(published);
  const pack = newLessonPackFromAuthoring({ authoring: newLessonAuthoringFixture(), context, moduleId: "mat", authorId: "fixture-author", generationRunId: "fixture-new-lesson-run" });
  return { context, base, pack };
}
