// Canonical MAT-PREREQ authoring. Update this lesson in an existing seed without rebuilding other lessons.
// Usage: node scripts/build-ifsc-math-preparation.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const seedPath = "packs/seeds/ifsc-2027.golden.track.v2.json";
const figurePath = "packs/seeds/ifsc-2027.lesson-drafts/figures/MAT-PREREQ/tres-decimos.svg";
const fraction = "MAT.FRACTION.MEANING";
const decimal = "MAT.DECIMAL.MEANING";
const ratio = "MAT.PROPORTION.CONCEPT";
const block = (id, type, payload, conceptIds = []) => ({ id, type, schemaVersion: 1, conceptIds, payload });

export function applyMathPreparation(pack) {
  const preparation = pack.track.modules.flatMap(module => module.lessons).find(lesson => lesson.id === "MAT-PREREQ");
  if (!preparation) throw new Error("MAT-PREREQ must exist in the Golden seed");

  const definitions = [
    {
      conceptId: fraction,
      stem: "Qual número decimal representa 1/4?",
      options: ["0,14", "0,20", "0,25", "0,40", "4,00"],
      choiceId: "C",
      explanation: "1/4 = 25/100 = 0,25: multiplicamos o numerador e o denominador por 25. Também podemos calcular 1 ÷ 4 = 0,25.",
      hints: ["O denominador indica em quantas partes iguais o inteiro foi dividido.", "Procure uma fração equivalente com denominador 100 e escreva-a em decimal."]
    },
    {
      conceptId: decimal,
      stem: "Uma estudante completou 0,4 de uma lista de exercícios. Que porcentagem da lista ela completou?",
      options: ["4%", "40%", "0,4%", "60%", "400%"],
      choiceId: "B",
      explanation: "0,4 = 4/10 = 40/100 = 40%. A pergunta pede a parte concluída, não a parte que falta.",
      hints: ["Porcentagem compara uma quantidade com 100 partes iguais.", "Multiplique o decimal por 100 para obter o número que acompanha o símbolo %."]
    },
    {
      conceptId: ratio,
      stem: "Uma receita usa 2 copos de leite para cada 5 colheres de açúcar. Mantendo a proporção, quantas colheres de açúcar serão usadas com 6 copos de leite?",
      options: ["5", "9", "10", "30", "15"],
      choiceId: "E",
      explanation: "O leite foi multiplicado por 3 (6 ÷ 2 = 3); o açúcar também deve ser: 5 × 3 = 15 colheres.",
      hints: ["Compare a quantidade inicial de leite com a quantidade nova.", "Para manter a proporção, aplique às colheres de açúcar o mesmo fator usado nos copos de leite."]
    }
  ];
  const questions = definitions.map((definition, index) => ({
    id: `Q-MAT-PREREQ-${index + 1}`, version: 2, subjectCode: "MAT",
    primaryConceptId: definition.conceptId, conceptIds: [definition.conceptId],
    type: "multiple_choice", difficulty: "foundation", cognitiveOperations: ["calculate"],
    stem: definition.stem,
    choices: definition.options.map((content, index) => {
      const id = String.fromCharCode(65 + index);
      return { id, content, correct: id === definition.choiceId, ...(id !== definition.choiceId ? { targetsError: "conceptual" } : {}) };
    }),
    answer: { kind: "multiple_choice", choiceId: definition.choiceId },
    explanation: definition.explanation, sourceIds: ["src-ifsc-golden-author"],
    provenance: { type: "generated", generationRunId: "ifsc-golden-author-v1" },
    exposurePolicy: { minimumDaysBetween: 1, reservedForAssessment: false }, status: "draft"
  }));

  preparation.version = 3;
  preparation.status = "draft";
  preparation.objectives = preparation.concepts.map(concept => concept.title);
  preparation.exitTicketQuestionIds = questions.map(question => question.id);
  preparation.blocks = [
    block("mat-prereq-hook", "text", { content: "Uma barra de chocolate foi dividida em 10 pedaços iguais. Você comeu 3. Essa quantidade pode ser escrita como 3/10, 0,3 ou 30%. Nesta aula, vamos entender essas escritas e aprender a manter as proporções de uma receita." }),
    block("mat-prereq-fraction", "concept", {
      conceptId: fraction, title: "Frações: partes iguais e divisão",
      content: "Uma fração pode representar partes iguais de um todo ou uma divisão. Em 1/2, o denominador (número de baixo) indica duas partes iguais; o numerador (número de cima) indica uma dessas partes.\n\nPara escrever uma fração em decimal, divida o numerador pelo denominador. Também podemos usar uma fração equivalente: multiplicar os dois números pelo mesmo fator diferente de zero não altera seu valor."
    }, [fraction]),
    block("mat-prereq-decimal-concept", "concept", {
      conceptId: decimal, title: "Décimos e centésimos",
      content: "Na escrita decimal, a primeira casa depois da vírgula representa décimos; a segunda, centésimos. Assim, 0,5 = 5/10 e 0,25 = 25/100.\n\nNa barra de chocolate, 3 de 10 partes iguais correspondem a 3/10 = 0,3. Se cada décimo fosse dividido em 10 partes iguais, seriam 30 de 100 partes: 30/100 = 30%."
    }, [decimal]),
    block("mat-prereq-figure", "figure", {
      src: `data:image/svg+xml;base64,${readFileSync(figurePath).toString("base64")}`,
      alt: "Barra dividida em dez partes iguais, das quais três estão destacadas.",
      caption: "3 de 10 partes iguais: 3/10 = 0,3 = 30%.",
      longDescription: "O retângulo representa uma barra inteira dividida em dez partes de mesma área. Três partes estão destacadas e sete não. A parte destacada representa três décimos: 3/10 = 0,3 = 30%. Todas essas informações também aparecem no texto da aula.",
      credit: "Ilustração própria (rascunho)", width: 390, height: 200
    }, [fraction, decimal]),
    block("mat-prereq-fraction-example", "worked-example", {
      title: "Da fração para o decimal",
      content: "1. Queremos escrever 3/4 em decimal.\n2. Para obter denominador 100, multiplicamos 4 por 25.\n3. Multiplicamos o numerador pelo mesmo fator: 3 × 25 = 75.\n4. Assim, 3/4 = 75/100 = 0,75."
    }, [fraction, decimal]),
    block("mat-prereq-decimal", "worked-example", {
      title: "Do decimal para a porcentagem",
      content: "Porcentagem compara uma quantidade com 100 partes iguais. O inteiro 1 corresponde a 100%.\n\n1. O decimal 0,75 corresponde a 75/100.\n2. Portanto, 0,75 = 75%.\n3. Para converter, multiplique o decimal por 100 e acrescente o símbolo % ao resultado: 0,75 × 100 = 75; a porcentagem é 75%."
    }, [decimal]),
    block("mat-prereq-ratio-concept", "concept", {
      conceptId: ratio, title: "Razão e proporção",
      content: "Razão é uma comparação por divisão. Uma receita usa 3 copos de farinha para 2 copos de água: a razão entre farinha e água é 3/2, nessa ordem.\n\nProporção é a igualdade entre duas razões. Com 6 copos de farinha e 4 de água, temos 3/2 = 6/4. Multiplicar as duas quantidades pelo mesmo fator mantém a proporção."
    }, [ratio]),
    block("mat-prereq-ratio", "worked-example", {
      title: "Mantenha a mesma razão",
      content: "1. A receita usa 3 copos de farinha para 2 de água.\n2. A nova quantidade de farinha é 6 copos: o fator é 6 ÷ 3 = 2.\n3. A água deve ser multiplicada pelo mesmo fator: 2 × 2 = 4 copos.\n4. Conferência: 3/2 = 6/4; as duas razões valem 1,5."
    }, [ratio]),
    block("mat-prereq-practice", "guided-steps", {
      title: "Experimente antes do desafio",
      steps: [{ id: "water", prompt: "Um suco usa 2 medidas de concentrado para 3 de água. Com 4 medidas de concentrado, quantas medidas de água mantêm a proporção?", expected: 6 }],
      hints: ["Compare a quantidade inicial de concentrado com a nova quantidade."],
      explanation: "O concentrado dobrou, de 2 para 4; a água também deve dobrar, de 3 para 6 medidas."
    }, [ratio]),
    block("mat-prereq-warning", "warning", {
      title: "Somar não mantém necessariamente a proporção",
      content: "Na receita de 3 copos de farinha para 2 de água, acrescentar 3 copos a cada ingrediente resulta em 6 de farinha e 5 de água. A proporção mudou: 3/2 é diferente de 6/5.\n\nPara dobrar a receita, multiplique as duas quantidades por 2: serão 6 copos de farinha e 4 de água."
    }, [ratio]),
    block("mat-prereq-summary", "summary", {
      title: "Para lembrar depois",
      content: "Fração em decimal: divida o numerador pelo denominador ou encontre uma fração equivalente.\nDécimos e centésimos: primeira e segunda casas depois da vírgula.\nDecimal em porcentagem: multiplique por 100 e acrescente %.\nProporção: mantenha a ordem das quantidades e multiplique ambas pelo mesmo fator.\nAgora tente as três questões finais sem consultar os exemplos."
    })
  ];
  preparation.activities = questions.map((question, index) => ({
    id: `mat-prereq-q${index + 1}`, type: "question", prompt: question.stem,
    conceptIds: question.conceptIds, questionId: question.id,
    config: { hints: definitions[index].hints, phase: "exit_ticket" }
  }));
  const replacements = new Map(questions.map(question => [question.id, question]));
  pack.questions = pack.questions.map(question => replacements.get(question.id) ?? question);
  for (const question of questions) if (!pack.questions.some(existing => existing.id === question.id)) pack.questions.push(question);
  // A new pack version can be imported without changing an already imported content hash.
  pack.version = Math.max(pack.version, 2);
  return pack;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pack = applyMathPreparation(JSON.parse(readFileSync(seedPath, "utf8")));
  writeFileSync(seedPath, `${JSON.stringify(pack, null, 2)}\n`);
  console.log("Updated MAT-PREREQ lesson v3 and its three Questions v2 (draft)");
}
