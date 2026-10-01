import { getOwnerProfile } from "@/features/auth/owner";
import { ensureDatabaseReady, getDatabaseUrl } from "@/db/connection";
import { ExportRepository } from "@/db/repositories/export-repository";
import { MemoryExportRepository } from "@/db/repositories/memory-store";
import { getGamificationSummary } from "@/features/gamification/api";

import {
  buildExportPayload,
  buildExportPreview,
  parseExportKind,
  type ExportKind,
  type ExportPayload,
  type ExportPreview
} from "./export-contracts";

export async function getExportPreviews(): Promise<ExportPreview[]> {
  const snapshot = await getExportSnapshot();

  return [
    buildExportPreview("backup", snapshot),
    buildExportPreview("progress", snapshot),
    buildExportPreview("teacher_context", snapshot)
  ];
}

export async function getExportPreview(kindInput: string | null): Promise<ExportPreview> {
  const kind = parseExportKind(kindInput);
  const snapshot = await getExportSnapshot();

  return buildExportPreview(kind, snapshot);
}

export async function getExportPayload({
  kind: kindInput,
  selectedLessonStableId = null
}: Readonly<{
  kind: string | null;
  selectedLessonStableId?: string | null;
}>): Promise<ExportPayload> {
  const kind: ExportKind = parseExportKind(kindInput);
  const snapshot = await getExportSnapshot();

  return buildExportPayload({ kind, snapshot, selectedLessonStableId });
}

async function getExportSnapshot() {
  const {ownerId,role} = await getOwnerProfile();
  await getGamificationSummary();

  if (getDatabaseUrl() === "memory://local") {
    const snapshot=await new MemoryExportRepository().getSnapshot(ownerId);return role==="ADMIN"?snapshot:{...snapshot,packManifests:[]};
  }

  await ensureDatabaseReady();
  const snapshot=await new ExportRepository().getSnapshot(ownerId);
  // Student exports carry owned learning facts; editorial manifests contain reserved questions and keys.
  return role==="ADMIN"?snapshot:{...snapshot,packManifests:[]};
}

