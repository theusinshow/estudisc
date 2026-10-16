import "server-only";

import { getDatabaseUrl } from "@/db/connection";
import { DrizzleQuestionRepository } from "@/db/repositories/question-repository";
import { questionReferenceSchema } from "@/features/activities/application/question-reference";
import { getLesson } from "@/features/lessons/api";
import { FREE_SAMPLE_LESSONS } from "@/features/payments/contracts";
import type { Question } from "@/features/questions/contracts";
import type { SampleQuestionData } from "./sample-question";

/** Short, self-contained, published, non-official and not reserved: safe to solve on a public page. */
function eligible(question: Question) {
  return question.status === "published" && question.type === "multiple_choice" && question.provenance.type !== "official_exam"
    && !question.exposurePolicy.reservedForAssessment && !question.stimulus && !question.assets?.length
    && question.stem.length <= 160 && (question.choices?.filter(choice => choice.correct).length ?? 0) === 1;
}

/**
 * Picks the first eligible question of the free sample lessons, in their published versions. Returns
 * null (the landing then shows no sample) when there is no persistent catalog or nothing qualifies.
 */
export async function loadSampleQuestion(): Promise<SampleQuestionData | null> {
  const url = getDatabaseUrl();
  if (!url || url === "memory://local") return null;
  try {
    const repository = new DrizzleQuestionRepository();
    for (const sample of FREE_SAMPLE_LESSONS) {
      const lesson = await getLesson(sample.id);
      if (!lesson) continue;
      for (const activity of lesson.activities) {
        const reference = questionReferenceSchema.safeParse(activity.config);
        if (!reference.success) continue;
        const found = await repository.getVersion(reference.data.questionId, reference.data.questionVersion);
        if (!found || !eligible(found.question)) continue;
        const choices = found.question.choices ?? [];
        return {
          lessonTitle: sample.title,
          subject: sample.subject,
          stem: found.question.stem,
          choices: choices.map(choice => ({ id: choice.id, content: choice.content })),
          correctChoiceId: choices.find(choice => choice.correct)!.id,
          explanation: found.question.explanation
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}
