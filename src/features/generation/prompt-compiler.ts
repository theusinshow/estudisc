import type { CompiledGenerationPrompt, GenerationSpec } from "@/features/generation/contracts";

const compactLessonExample = {
  schema: "caderno.lesson.v1",
  lesson: {
    id: "stable-lesson-id",
    version: 1,
    title: "Titulo da aula",
    concepts: [{ id: "stable-concept-id", title: "Conceito", summary: "Resumo curto." }],
    blocks: [{ id: "intro", type: "text", text: "Texto curto e direto." }],
    activities: [
      {
        id: "activity-001",
        type: "prediction",
        conceptIds: ["stable-concept-id"],
        prompt: "Pergunta objetiva."
      }
    ]
  }
} as const;

export function compileGenerationPrompt(spec: GenerationSpec): CompiledGenerationPrompt {
  const jsonExample = spec.targetSchema==="caderno.track.v2"?JSON.stringify({schema:"caderno.track.v2",packId:spec.importTarget.packId,version:spec.importTarget.version,language:"pt-BR",sources:[],curriculumRequirements:[],conceptPrerequisites:[],questions:[],track:{id:spec.importTarget.trackId,title:spec.importTarget.trackTitle,metadata:{},modules:[{id:spec.importTarget.moduleId,title:spec.importTarget.moduleTitle,subjectCode:spec.sourcePackContext?.subjectCode,lessons:[{id:"stable-lesson-id",version:1,title:spec.lessonTitle,kind:"core",status:"draft",estimatedMinutes:30,concepts:spec.concepts,objectives:[spec.lessonGoal],sourceIds:spec.sourcePackContext?.sourceIds??[],prerequisiteConceptIds:spec.sourcePackContext?.prerequisiteConceptIds??[],exitTicketQuestionIds:[],blocks:[],activities:[]}]}]}}):JSON.stringify(compactLessonExample);
  const concepts = spec.concepts.map((concept) => `- ${concept.id}: ${concept.title}`).join("\n");
  const activityTypes = spec.activityTypes.join(", ");
  const constraints = spec.constraints.length > 0 ? spec.constraints.map((item) => `- ${item}`).join("\n") : "- Sem restricoes adicionais.";

  return {
    targetSchema: spec.targetSchema,
    jsonExample,
    prompt: [
      "Voce esta gerando conteudo para KNOW/OS.",
      `Responda somente com JSON valido no schema ${spec.targetSchema}.`,
      "Nao use Markdown, comentarios, texto antes ou depois do JSON.",
      "Nao inclua scripts, HTML executavel, URLs de rastreamento, segredos ou chaves de API.",
      "Use portugues do Brasil.",
      ...(spec.targetSchema==="caderno.track.v2"?["Use somente conteúdo em rascunho, Concepts atômicos e fontes explícitas. Escreva ensino, exemplo resolvido, prática guiada, prática independente, transferência e exit ticket; não use placeholders. Questões precisam de respostas tipadas, explicações, dificuldade e provenance generated com generationRunId do trabalho. Nenhum conteúdo gerado aprova o próprio QA.",`SourcePack context: ${JSON.stringify(spec.sourcePackContext)}`]:[]),
      "",
      `Titulo da aula: ${spec.lessonTitle}`,
      `Objetivo: ${spec.lessonGoal}`,
      `Nivel do publico: ${spec.audienceLevel}`,
      `Tipos de atividade permitidos: ${activityTypes}`,
      "",
      "Conceitos obrigatorios:",
      concepts,
      "",
      "Restricoes:",
      constraints,
      "",
      "Exemplo compacto de formato JSON:",
      jsonExample
    ].join("\n")
  };
}
