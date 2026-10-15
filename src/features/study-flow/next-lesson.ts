/** Continuous study flow (ADR 0060): which whole lesson a student studies next. Sequencing only — never mastery. */
export type FlowLesson = { id: string; title: string; subjectCode: string; order: number; estimatedMinutes: number; questionIds: readonly string[] };
export type FlowProgress = {
  completedLessonIds: readonly string[];
  inProgress: readonly { lessonId: string; updatedAt: Date }[];
  answeredQuestionIds: readonly string[];
};
export type NextLesson = { lesson: FlowLesson; resume: boolean };

export const DONE_ANSWERED_SHARE = 0.8;
const SUBJECT_ORDER = ["MAT", "CIE", "GH", "POR"];

export function isLessonDone(lesson: FlowLesson, progress: FlowProgress, answered: ReadonlySet<string> = new Set(progress.answeredQuestionIds)) {
  if (progress.completedLessonIds.includes(lesson.id)) return true;
  const ids = new Set(lesson.questionIds);
  if (!ids.size) return false;
  let count = 0;
  for (const id of ids) if (answered.has(id)) count++;
  return count / ids.size >= DONE_ANSWERED_SHARE;
}

function subjectRank(code: string) {
  const index = SUBJECT_ORDER.indexOf(code);
  return index === -1 ? SUBJECT_ORDER.length : index;
}

export function chooseNextLessons(lessons: readonly FlowLesson[], progress: FlowProgress): { next: NextLesson | null; bySubject: NextLesson[] } {
  const answered = new Set(progress.answeredQuestionIds);
  const done = new Set(lessons.filter(lesson => isLessonDone(lesson, progress, answered)).map(lesson => lesson.id));
  const subjects = [...new Set(lessons.map(lesson => lesson.subjectCode))].sort((a, b) => subjectRank(a) - subjectRank(b) || a.localeCompare(b));
  const bySubject = subjects.flatMap(code => {
    const pending = lessons.filter(lesson => lesson.subjectCode === code && !done.has(lesson.id)).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    return pending.length ? [{ lesson: pending[0], resume: false, finished: lessons.filter(lesson => lesson.subjectCode === code && done.has(lesson.id)).length }] : [];
  });
  const touched = [...progress.inProgress].filter(entry => !done.has(entry.lessonId)).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const resumed = touched.map(entry => lessons.find(lesson => lesson.id === entry.lessonId)).find(Boolean);
  const inProgressIds = new Set(touched.map(entry => entry.lessonId));
  const subjectNext = [...bySubject].sort((a, b) => a.finished - b.finished || subjectRank(a.lesson.subjectCode) - subjectRank(b.lesson.subjectCode))[0];
  return {
    next: resumed ? { lesson: resumed, resume: true } : subjectNext ? { lesson: subjectNext.lesson, resume: false } : null,
    bySubject: bySubject.map(({ lesson }) => ({ lesson, resume: inProgressIds.has(lesson.id) }))
  };
}
