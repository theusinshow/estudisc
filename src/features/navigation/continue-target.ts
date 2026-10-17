import type { NextLesson } from "@/features/study-flow/next-lesson";

/**
 * Where the central "Continuar" button goes: an unfinished lesson first (never lose momentum),
 * then due reviews (they decay), then the next new lesson, otherwise Today.
 */
export function resolveContinueTarget({ next, dueReviewCount }: Readonly<{ next: NextLesson | null; dueReviewCount: number }>): string {
  const lessonPath = (id: string) => `/lessons/${encodeURIComponent(id)}`;
  if (next?.resume) return lessonPath(next.lesson.id);
  if (dueReviewCount > 0) return "/review";
  if (next) return lessonPath(next.lesson.id);
  return "/";
}
