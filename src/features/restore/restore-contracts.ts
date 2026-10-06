import { z } from "zod";

import type { RestoreProvenanceRecord } from "@/db/repositories/restore-provenance-repository";
import { hashCanonicalJson } from "@/lib/canonical-json";

export const MAX_RESTORE_BYTES = 1024 * 1024;

const exportPayloadSchema = z.object({
  schema: z.enum(["estudisc.export.v1", "know-os.export.v1"]),
  kind: z.enum(["backup", "progress", "teacher_context"]),
  exportedAt: z.string(),
  privacy: z.object({
    warnings: z.array(z.string()),
    includesPrivateSourceCode: z.boolean(),
    includesProjectContext: z.boolean()
  }),
  payload: z.unknown()
});

const backupPayloadSchema = z.object({
  packManifests: z.array(z.unknown()),
  tracks: z.array(z.unknown()),
  knowledgeMap: z.array(z.unknown()),
  masteryEvidence: z.array(z.unknown()),
  recentAttempts: z.array(z.unknown()),
  dueReviews: z.array(z.unknown()),
  mistakes: z.array(z.unknown()),
  projects: z.array(z.unknown()),
  xpSummary: z.object({
    totalXp: z.number(),
    transactions: z.array(z.unknown())
  }),
  gamification: z
    .object({
      badgeAwards: z.array(z.unknown()),
      missionProgress: z.array(z.unknown()),
      missionEvents: z.array(z.unknown())
    })
    .optional(),
  events: z.array(z.unknown())
});

export type RestoreBackupPayload = z.infer<typeof backupPayloadSchema>;

export type RestorePreviewResult =
  | Readonly<{
      status: "ready";
      schema: "estudisc.restore-preview.v1";
      sourceExportedAt: string;
      categories: readonly RestoreCategory[];
      warnings: readonly string[];
      applicationMode: "non_destructive_plan";
      userStatePlan: UserStateRestoreDryRunPlan;
    }>
  | Readonly<{
      status: "invalid";
      code: "invalid_restore_payload" | "unsupported_restore_kind";
      message: string;
      issues?: readonly string[];
    }>;

export type RestoreCategory = Readonly<{
  id: string;
  label: string;
  count: number;
  private: boolean;
}>;

export type UserStateRestoreDryRunPlan = Readonly<{
  schema: "estudisc.user-state-restore-dry-run.v1";
  mode: "user_state_dry_run";
  sourceExportFingerprint: string;
  applyEnabled: false;
  categories: readonly UserStateRestoreCategoryPlan[];
  blockers: readonly UserStateRestoreBlocker[];
  warnings: readonly string[];
}>;

export type UserStateRestoreCategoryPlan = Readonly<{
  id: string;
  label: string;
  sourceCount: number;
  restoreStrategy: "append_only_import" | "projection_rebuild" | "content_reference";
  status: "empty" | "plan_only" | "blocked";
  reason: string;
}>;

export type UserStateRestoreBlocker = Readonly<{
  code:
    | "user_state_apply_not_implemented"
    | "restore_provenance_required"
    | "pack_manifest_required_for_user_state";
  message: string;
}>;

export function previewRestore(input: unknown): RestorePreviewResult {
  const parsed = exportPayloadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "invalid",
      code: "invalid_restore_payload",
      message: "O arquivo não segue o contrato estudisc.export.v1.",
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    };
  }

  if (parsed.data.kind !== "backup") {
    return {
      status: "invalid",
      code: "unsupported_restore_kind",
      message: "Somente exports Backup podem ser usados para restore."
    };
  }

  const backup = backupPayloadSchema.safeParse(parsed.data.payload);

  if (!backup.success) {
    return {
      status: "invalid",
      code: "invalid_restore_payload",
      message: "O Backup não contém as categorias esperadas.",
      issues: backup.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    };
  }

  const categories: RestoreCategory[] = [
    { id: "pack_manifests", label: "Manifestos de Pack", count: backup.data.packManifests.length, private: false },
    { id: "content_references", label: "Referências de conteúdo", count: backup.data.tracks.length, private: false },
    { id: "knowledge_map", label: "Mapa de conhecimento", count: backup.data.knowledgeMap.length, private: false },
    {
      id: "mastery_evidence",
      label: "Evidência de mastery",
      count: backup.data.masteryEvidence.length,
      private: true
    },
    { id: "attempts", label: "Tentativas", count: backup.data.recentAttempts.length, private: true },
    { id: "review_queue", label: "Fila de review", count: backup.data.dueReviews.length, private: true },
    { id: "mistakes", label: "Erros", count: backup.data.mistakes.length, private: true },
    { id: "projects", label: "Projetos", count: backup.data.projects.length, private: true },
    { id: "xp", label: "XP", count: backup.data.xpSummary.transactions.length, private: false },
    {
      id: "gamification",
      label: "Gamificação",
      count:
        (backup.data.gamification?.badgeAwards.length ?? 0) +
        (backup.data.gamification?.missionProgress.length ?? 0),
      private: false
    },
    { id: "history", label: "Histórico", count: backup.data.events.length, private: true }
  ];

  return {
    status: "ready",
    schema: "estudisc.restore-preview.v1",
    sourceExportedAt: parsed.data.exportedAt,
    categories,
    warnings: [
      "Restore deve ser revisado antes de aplicar porque pode incluir código-fonte, projetos e histórico privado.",
      "O plano V1 é não destrutivo: não apaga dados locais existentes."
    ],
    applicationMode: "non_destructive_plan",
    userStatePlan: buildUserStateRestoreDryRunPlan({
      sourceExport: parsed.data,
      payload: backup.data
    })
  };
}

export function buildUserStateRestoreDryRunPlan({
  sourceExport,
  payload,
  existingProvenance = []
}: Readonly<{
  sourceExport: unknown;
  payload: RestoreBackupPayload;
  existingProvenance?: readonly RestoreProvenanceRecord[];
}>): UserStateRestoreDryRunPlan {
  const sourceExportFingerprint = hashCanonicalJson(sourceExport);
  const categories = getUserStateCategoryPlans(payload);
  const userStateCount = categories
    .filter((category) => category.restoreStrategy !== "content_reference")
    .reduce((total, category) => total + category.sourceCount, 0);
  const blockers: UserStateRestoreBlocker[] = [
    {
      code: "user_state_apply_not_implemented",
      message: "Restore completo de estado ainda não possui modo apply habilitado."
    },
    {
      code: "restore_provenance_required",
      message: "Aplicação futura exige ledger de provenance e idempotência por registro de origem."
    }
  ];

  if (userStateCount > 0 && payload.packManifests.length === 0) {
    blockers.push({
      code: "pack_manifest_required_for_user_state",
      message: "Estado do usuário só pode ser planejado quando os manifests de Pack necessários acompanham o Backup."
    });
  }

  return {
    schema: "estudisc.user-state-restore-dry-run.v1",
    mode: "user_state_dry_run",
    sourceExportFingerprint,
    applyEnabled: false,
    categories,
    blockers,
    warnings: [
      "Dry-run apenas planeja replay de estado; o endpoint V1 não aplica tentativas, XP, histórico, erros, reviews ou gamificação.",
      existingProvenance.length > 0
        ? "Este fingerprint já possui registros de provenance; o apply futuro precisará tratar idempotência por registro."
        : "Nenhum registro de provenance foi considerado neste dry-run."
    ]
  };
}

export function parseRestoreBackupPayload(input: unknown):
  | Readonly<{ ok: true; exportedAt: string; payload: RestoreBackupPayload }>
  | Readonly<{ ok: false; preview: RestorePreviewResult }> {
  const parsed = exportPayloadSchema.safeParse(input);

  if (!parsed.success || parsed.data.kind !== "backup") {
    return { ok: false, preview: previewRestore(input) };
  }

  const backup = backupPayloadSchema.safeParse(parsed.data.payload);

  if (!backup.success) {
    return { ok: false, preview: previewRestore(input) };
  }

  return { ok: true, exportedAt: parsed.data.exportedAt, payload: backup.data };
}

function getUserStateCategoryPlans(payload: RestoreBackupPayload): UserStateRestoreCategoryPlan[] {
  return [
    {
      id: "pack_manifests",
      label: "Manifestos de Pack",
      sourceCount: payload.packManifests.length,
      restoreStrategy: "content_reference",
      status: payload.packManifests.length === 0 ? "empty" : "plan_only",
      reason: "Conteúdo precisa ser resolvido antes de qualquer replay de estado."
    },
    appendOnlyPlan("attempts", "Tentativas", payload.recentAttempts.length),
    appendOnlyPlan("mastery_evidence", "Evidência de mastery", payload.masteryEvidence.length),
    projectionPlan("review_queue", "Fila de review", payload.dueReviews.length),
    projectionPlan("mistakes", "Erros", payload.mistakes.length),
    projectionPlan("projects", "Projetos", payload.projects.length),
    appendOnlyPlan("xp", "XP", payload.xpSummary.transactions.length),
    projectionPlan(
      "gamification",
      "Gamificação",
      (payload.gamification?.badgeAwards.length ?? 0) +
        (payload.gamification?.missionProgress.length ?? 0) +
        (payload.gamification?.missionEvents.length ?? 0)
    ),
    appendOnlyPlan("history", "Histórico", payload.events.length)
  ];
}

function appendOnlyPlan(id: string, label: string, sourceCount: number): UserStateRestoreCategoryPlan {
  return {
    id,
    label,
    sourceCount,
    restoreStrategy: "append_only_import",
    status: sourceCount === 0 ? "empty" : "blocked",
    reason:
      sourceCount === 0
        ? "Sem registros para replay."
        : "Replay append-only depende de provenance e apply futuro."
  };
}

function projectionPlan(id: string, label: string, sourceCount: number): UserStateRestoreCategoryPlan {
  return {
    id,
    label,
    sourceCount,
    restoreStrategy: "projection_rebuild",
    status: sourceCount === 0 ? "empty" : "blocked",
    reason:
      sourceCount === 0
        ? "Sem projeção para reconciliar."
        : "Projeção precisa ser reconstruída a partir de registros append-only antes de aplicar."
  };
}
