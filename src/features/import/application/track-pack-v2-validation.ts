import { validateCurriculum } from "@/features/curriculum/api";
import type { TrackPackV2 } from "./track-pack-v2-schema";
import { codeBlockSchema, conceptBlockSchema, figureBlockSchema, textBlockSchema, titledTextBlockSchema } from "@/features/lessons/blocks/block-schemas";
import { parseCodeActivityConfig } from "@/features/activities/application/code-activity-config";
import { parseStaticActivityConfig } from "@/features/activities/application/static-activity-config";
import { educationalActivitySchema } from "@/features/activities/application/educational-activity";
import { numericExplorerSchema } from "@/features/lessons/blocks/numeric-explorer-schema";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { atomModelSchema } from "@/features/lessons/blocks/atom-model-schema";

export function curriculumFromV2(pack: TrackPackV2) {
  return {
    sources: pack.sources,
    requirements: pack.curriculumRequirements.map(({ status: _ignored, ...requirement }) => { void _ignored; return requirement; }),
    prerequisites: pack.conceptPrerequisites,
    settings: pack.track.modules.flatMap(moduleDefinition => moduleDefinition.lessons.flatMap(lesson => lesson.concepts.map(concept => ({ conceptId: concept.id, moduleId: moduleDefinition.id, subjectCode: moduleDefinition.subjectCode, importance: concept.importance }))))
  };
}

export function validateTrackPackV2Semantics(pack: TrackPackV2) {
  const context = { moduleIds: pack.track.modules.map(moduleDefinition => moduleDefinition.id), concepts: pack.track.modules.flatMap(moduleDefinition => moduleDefinition.lessons.flatMap(lesson => lesson.concepts.map(concept => ({ id: concept.id, moduleId: moduleDefinition.id, subjectCode: moduleDefinition.subjectCode })))) };
  const curriculum = validateCurriculum(curriculumFromV2(pack), context);
  const issues = curriculum.ok ? [] : [...curriculum.issues];
  const fail = (path: string, message: string) => issues.push({ code: "invalid_reference", path, message });
  const sources = new Map(pack.sources.map(source => [source.id, source]));
  const questions = new Map(pack.questions.map(question => [question.id, question]));
  const concepts = new Set(context.concepts.map(concept => concept.id));
  const ids = new Set<string>();
  const unique = (id: string, path: string) => { if (ids.has(id)) fail(path, `Duplicate stable ID ${id}`); ids.add(id); };
  // Extend these alongside the actual renderer/registry capabilities in IFSC-03.
  const educationalTypes = new Set(["numeric", "ordering", "classification", "matching", "text-highlight", "guided-steps"]);
  const registeredBlocks = new Set(["text", "concept", "note", "warning", "code", "example", "prediction", "summary", "worked-example", "numeric-explorer", "diagram", "timeline", "figure", ...educationalTypes]);
  const registeredActivities = new Set(["prediction", "multiple-choice", "code", "debug", "question", ...educationalTypes]);
  unique(pack.track.id, "track.id");
  for (const question of pack.questions) {
    unique(question.id, "questions");
    if (question.conceptIds.some(id => !concepts.has(id)) || question.sourceIds.some(id => !sources.has(id))) fail("questions", "Unknown Concept/source");
    if(question.assets.some(asset=>!question.sourceIds.includes(asset.sourceId)))fail("questions.assets","Asset source is not part of the Question provenance");
    if (question.provenance.type === "official_exam") {
      const officialSources = question.sourceIds.map(id => sources.get(id)).filter(source => source?.type === "official_exam");
      if (!officialSources.length) fail("questions.provenance", "Official item needs its exam source");
      if (officialSources.some(source => source?.metadata.protected === true) && !question.exposurePolicy.reservedForAssessment) fail("questions.exposurePolicy", "Protected source requires reservation");
    }
    if (question.provenance.type === "derived" && (!questions.has(question.provenance.derivedFromQuestionId!) || question.provenance.derivedFromQuestionId === question.id)) fail("questions.provenance", "Unknown/self-derived original");
  }
  for (const moduleDefinition of pack.track.modules) {
    unique(moduleDefinition.id, "track.modules");
    for (const lesson of moduleDefinition.lessons) {
      unique(lesson.id, "lessons");
      for (const concept of lesson.concepts) unique(concept.id, "concepts");
      for (const sourceId of lesson.sourceIds) if (!sources.has(sourceId)) fail("lessons.sourceIds", "Unknown source");
      for (const id of lesson.prerequisiteConceptIds) if (!concepts.has(id)) fail("lessons.prerequisites", "Unknown prerequisite");
      for (const block of lesson.blocks) {
        unique(block.id, "blocks");
        if (!registeredBlocks.has(block.type)) fail("blocks.type", `Interaction ${block.type} is not registered yet`);
        else {
          const schema = block.type === "figure" ? figureBlockSchema : block.type === "diagram" ? atomModelSchema : block.type === "numeric-explorer" ? numericExplorerSchema : block.type === "timeline" || educationalTypes.has(block.type) ? educationalActivitySchema : block.type === "code" ? codeBlockSchema : block.type === "text" ? textBlockSchema : block.type === "concept" ? conceptBlockSchema : titledTextBlockSchema;
          if (!schema.safeParse({ ...block.payload, ...block, ...(block.type==="timeline"?{type:"ordering"}:{}) }).success) fail("blocks.payload", "Invalid registered Block payload");
        }
        if (block.conceptIds.some(id => !concepts.has(id))) fail("blocks", "Unknown Concept");
      }
      for (const activity of lesson.activities) {
        unique(activity.id, "activities");
        if (!registeredActivities.has(activity.type)) fail("activities.type", `Activity ${activity.type} is not registered yet`);
        else {
          try {
            const config = { ...activity.config, ...activity };
            if (activity.type === "question") questionReferenceSchema.parse({ ...config, questionVersion: questions.get(activity.questionId!)?.version });
            else if (educationalTypes.has(activity.type)) educationalActivitySchema.parse(config);
            else (activity.type === "code" || activity.type === "debug" ? parseCodeActivityConfig : parseStaticActivityConfig)(config);
          }
          catch { fail("activities.config", "Invalid registered Activity config"); }
        }
        if (activity.conceptIds.some(id => !lesson.concepts.some(concept => concept.id === id))) fail("activities.conceptIds", "Unknown lesson Concept");
        if (activity.type === "question" && (!activity.questionId || !questions.has(activity.questionId))) fail("activities.questionId", "Unknown Question");
        const question = activity.questionId ? questions.get(activity.questionId) : undefined;
        if (question?.exposurePolicy.reservedForAssessment || question?.status === "annulled") fail("activities.questionId", "Reserved/annulled item cannot be lesson training");
      }
      for (const id of lesson.exitTicketQuestionIds) {
        const question = questions.get(id);
        if (!question || question.exposurePolicy.reservedForAssessment || question.status === "annulled") fail("lessons.exitTicketQuestionIds", "Unknown/reserved/annulled exit-ticket item");
      }
    }
  }
  return issues;
}
