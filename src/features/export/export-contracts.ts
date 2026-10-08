import type { ExportSnapshot } from "@/db/repositories/export-repository";

export const exportKinds = ["backup", "progress", "teacher_context"] as const;

export type ExportKind = (typeof exportKinds)[number];

export type ExportCategoryPreview = Readonly<{
  id: string;
  label: string;
  count: number;
  private: boolean;
}>;

export type ExportPreview = Readonly<{
  kind: ExportKind;
  label: string;
  categories: ExportCategoryPreview[];
  warnings: string[];
  approximateRecordCount: number;
}>;

export type ExportPayload = Readonly<{
  schema: "estudisc.export.v1";
  kind: ExportKind;
  exportedAt: string;
  privacy: Readonly<{
    warnings: string[];
    includesPrivateSourceCode: boolean;
    includesProjectContext: boolean;
  }>;
  payload: unknown;
}>;

export function parseExportKind(value: string | null): ExportKind {
  if (exportKinds.includes(value as ExportKind)) {
    return value as ExportKind;
  }

  return "backup";
}

export function buildExportPreview(kind: ExportKind, snapshot: ExportSnapshot): ExportPreview {
  const categories = getCategories(kind, snapshot);

  return {
    kind,
    label: getExportLabel(kind),
    categories,
    warnings: [...getWarnings(categories),...(kind==="backup"&&snapshot.learningState&&(!snapshot.learningState.routineAvailable||!snapshot.learningState.resumeAvailable)?["Rotina ou retomada ainda indisponível neste banco; estes registros não foram exportados."]:[])],
    approximateRecordCount: categories.reduce((total, category) => total + category.count, 0)
  };
}

export function buildExportPayload({
  kind,
  snapshot,
  selectedLessonStableId,
  exportedAt = new Date()
}: Readonly<{
  kind: ExportKind;
  snapshot: ExportSnapshot;
  selectedLessonStableId?: string | null;
  exportedAt?: Date;
}>): ExportPayload {
  const preview = buildExportPreview(kind, snapshot);

  return {
    schema: "estudisc.export.v1",
    kind,
    exportedAt: exportedAt.toISOString(),
    privacy: {
      warnings: preview.warnings,
      includesPrivateSourceCode: preview.categories.some((category) => category.id === "recent_attempts"),
      includesProjectContext: preview.categories.some((category) => category.id === "projects")
    },
    payload: getPayload(kind, snapshot, selectedLessonStableId ?? null)
  };
}

function getCategories(kind: ExportKind, snapshot: ExportSnapshot): ExportCategoryPreview[] {
  if (kind === "teacher_context") {
    return [
      { id: "selected_lesson", label: "Lição selecionada", count: 1, private: false },
      { id: "mastery_evidence", label: "Evidência de mastery", count: snapshot.masteryEvidence.length, private: true },
      { id: "recent_attempts", label: "Tentativas recentes", count: snapshot.recentAttempts.length, private: true },
      { id: "mistakes", label: "Erros", count: snapshot.mistakes.length, private: true },
      { id: "review_queue", label: "Fila de review", count: snapshot.dueReviews.length, private: true },
      { id: "projects", label: "Projetos", count: snapshot.projects.length, private: true }
    ];
  }

  if (kind === "progress") {
    return [
      { id: "mastery_evidence", label: "Evidência de mastery", count: snapshot.masteryEvidence.length, private: true },
      { id: "recent_attempts", label: "Tentativas recentes", count: snapshot.recentAttempts.length, private: true },
      { id: "review_queue", label: "Fila de review", count: snapshot.dueReviews.length, private: true },
      { id: "mistakes", label: "Erros", count: snapshot.mistakes.length, private: true },
      { id: "xp", label: "XP", count: snapshot.xpSummary.transactions.length, private: false },
      {
        id: "gamification",
        label: "Gamificação",
        count: snapshot.gamification.badgeAwards.length + snapshot.gamification.missionProgress.length,
        private: false
      },
      { id: "projects", label: "Projetos", count: snapshot.projects.length, private: true }
    ];
  }

  return [
    { id: "pack_manifests", label: "Manifestos de Pack", count: snapshot.packManifests.length, private: false },
    { id: "content_references", label: "Referências de conteúdo", count: snapshot.tracks.length, private: false },
    { id: "knowledge_map", label: "Mapa de conhecimento", count: snapshot.knowledgeMap.length, private: false },
    { id: "mastery_evidence", label: "Evidência de mastery", count: snapshot.masteryEvidence.length, private: true },
    { id: "recent_attempts", label: "Tentativas recentes", count: snapshot.recentAttempts.length, private: true },
    { id: "review_queue", label: "Fila de review", count: snapshot.dueReviews.length, private: true },
    { id: "mistakes", label: "Erros", count: snapshot.mistakes.length, private: true },
    { id: "projects", label: "Projetos", count: snapshot.projects.length, private: true },
    { id: "xp", label: "XP", count: snapshot.xpSummary.transactions.length, private: false },
    {
      id: "gamification",
      label: "Gamificação",
      count: snapshot.gamification.badgeAwards.length + snapshot.gamification.missionProgress.length,
      private: false
    },
    { id: "history", label: "Histórico", count: snapshot.events.length, private: true },
    ...(snapshot.learningState ? [
      { id: "routine", label: "Rotina de estudo privada", count: snapshot.learningState.routine.length, private: true },
      { id: "lesson_resumes", label: "Retomada e rascunhos não enviados", count: snapshot.learningState.lessonResumes.length, private: true }
    ] : [])
  ];
}

function getPayload(kind: ExportKind, snapshot: ExportSnapshot, selectedLessonStableId: string | null) {
  if (kind === "teacher_context") {
    return {
      selectedLessonStableId,
      masteryEvidence: snapshot.masteryEvidence,
      recentAttempts: snapshot.recentAttempts.slice(0, 5),
      mistakes: snapshot.mistakes,
      reviewQueue: snapshot.dueReviews,
      projects: snapshot.projects
    };
  }

  if (kind === "progress") {
    return {
      masteryEvidence: snapshot.masteryEvidence,
      recentAttempts: snapshot.recentAttempts,
      reviewQueue: snapshot.dueReviews,
      mistakes: snapshot.mistakes,
      xpSummary: snapshot.xpSummary,
      gamification: snapshot.gamification,
      projects: snapshot.projects
    };
  }

  return snapshot;
}

function getExportLabel(kind: ExportKind) {
  if (kind === "teacher_context") {
    return "Teacher Context";
  }

  if (kind === "progress") {
    return "Progress";
  }

  return "Backup";
}

function getWarnings(categories: readonly ExportCategoryPreview[]) {
  const warnings = new Set<string>();

  if (categories.some((category) => category.private)) {
    warnings.add("Revise antes de compartilhar: este export pode incluir dados privados de estudo.");
  }

  if (categories.some((category) => category.id === "recent_attempts")) {
    warnings.add("Inclui código-fonte submetido em tentativas recentes.");
  }

  if (categories.some((category) => category.id === "projects")) {
    warnings.add("Inclui contexto de projetos, que pode revelar objetivos pessoais ou profissionais.");
  }

  if (categories.some((category) => category.id === "lesson_resumes")) {
    warnings.add("Inclui rascunhos de respostas não enviadas e sua posição privada nas aulas.");
  }

  return Array.from(warnings);
}
