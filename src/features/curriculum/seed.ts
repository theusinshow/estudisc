import { and, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";

import type * as schema from "@/db/schema";
import { modules, packImports, tracks } from "@/db/schema";
import { DrizzleCurriculumRepository } from "@/db/repositories/curriculum-repository";
import { DrizzleTrackImportRepository } from "@/db/repositories/track-import-repository";
import { importTrackPack } from "@/features/import/api";

const moduleSubjectsSchema = z.array(z.object({ moduleId: z.string().min(1), subjectCode: z.string().min(1) }).strict());

// A temporary foundation seed uses the existing v1 importer; IFSC-02 moves these additions into Pack v2.
export async function importCurriculumFoundationSeed(db: PgDatabase<PgQueryResultHKT, typeof schema>, pack: unknown, foundation: unknown, moduleSubjects: unknown) {
  const subjects = moduleSubjectsSchema.parse(moduleSubjects);
  if (new Set(subjects.map(subject => subject.moduleId)).size !== subjects.length) throw new Error("Duplicate module subject assignment");
  return db.transaction(async tx => {
    const result = await importTrackPack(pack, new DrizzleTrackImportRepository(tx));
    if (result.status !== "imported" && result.status !== "already_imported") throw new Error(`Seed import ${result.status}`);
    const [track] = await tx.select().from(tracks).innerJoin(packImports, eq(tracks.packImportId, packImports.id))
      .where(and(eq(packImports.packId, result.packId), eq(packImports.version, result.version)));
    if (!track) throw new Error("Seed Track not found");
    for (const subject of subjects) {
      const [module] = await tx.select().from(modules).where(and(eq(modules.trackId, track.tracks.id), eq(modules.stableId, subject.moduleId)));
      if (!module || (module.subjectCode !== null && module.subjectCode !== subject.subjectCode)) throw new Error("Invalid module subject assignment");
      if (module.subjectCode === null) await tx.update(modules).set({ subjectCode: subject.subjectCode }).where(eq(modules.id, module.id));
    }
    await new DrizzleCurriculumRepository(tx).applyFoundation(track.tracks.id, foundation);
    return { status: result.status, trackId: track.tracks.id };
  });
}

