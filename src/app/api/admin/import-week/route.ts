import { NextResponse } from "next/server";

import weekPack from "../../../../../packs/releases/ifsc-week-1.pack.json";
import { ensureDatabaseReady, getDatabaseUrl } from "@/db/connection";
import { MemoryTrackImportRepository } from "@/db/repositories/memory-store";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { AccessDeniedError, requireAdmin } from "@/features/auth/owner";
import { importTrackPack } from "@/features/import/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click import of the bundled Week 1 pack (built by scripts/build-ifsc-week-pack.mjs). It lives only in
 * this admin-only server route, never in public assets, and imports as draft: publication still needs the
 * per-lesson review in /admin/review.
 */
export async function POST() {
  let profile;
  try {
    profile = await requireAdmin();
  } catch (error) {
    if (error instanceof AccessDeniedError) return NextResponse.json({ code: "admin_required" }, { status: 403 });
    throw error;
  }

  await ensureDatabaseReady();
  const repository = getDatabaseUrl() === "memory://local" ? new MemoryTrackImportRepository() : new DrizzleTrackImportRepository(undefined, profile.ownerId);
  const result = await importTrackPack(structuredClone(weekPack), repository);
  if (result.status === "imported" || result.status === "already_imported") return NextResponse.json({ status: result.status });
  return NextResponse.json({ code: result.status, message: "A Semana 1 não pôde ser importada.", ...("issues" in result ? { issues: result.issues } : {}) }, { status: result.status === "conflict" ? 409 : 400 });
}
