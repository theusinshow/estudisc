import { and, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { getDatabase } from "@/db/connection";
import type * as schema from "@/db/schema";
import { concepts, conceptPrerequisites, contentSourceLinks, contentSources, curriculumRequirementConcepts, curriculumRequirements, lessonConcepts, lessons, modules, trackConceptSettings, tracks,contentReleases } from "@/db/schema";
import { deriveRequirementCoverage, findGraphCycles, summarizeCurriculum, validateCurriculum } from "@/features/curriculum/api";
import { hashCanonicalJson } from "@/lib/canonical-json";

type CurriculumDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export class CurriculumConflictError extends Error {
  constructor() { super("Existing curriculum content differs; create a new Track Pack version."); }
}

export class DrizzleCurriculumRepository {
  constructor(private readonly db: CurriculumDatabase = getDatabase()) {}

  async applyFoundation(trackId: string, input: unknown) {
    return this.db.transaction(async tx => {
      const [track] = await tx.select().from(tracks).where(eq(tracks.id, trackId));
      if (!track) throw new Error("Track not found");
      const moduleRows = await tx.select().from(modules).where(eq(modules.trackId, trackId));
      const contextRows = await tx.select({ id: concepts.stableId, moduleId: modules.stableId, subjectCode: modules.subjectCode })
        .from(concepts).innerJoin(lessonConcepts, eq(lessonConcepts.conceptId, concepts.id))
        .innerJoin(lessons, eq(lessons.id, lessonConcepts.lessonId))
        .innerJoin(modules, eq(modules.id, lessons.moduleId)).where(eq(modules.trackId, trackId));
      const validation = validateCurriculum(input, { moduleIds: moduleRows.map(module => module.stableId), concepts: contextRows.map(row => ({ ...row, subjectCode: row.subjectCode ?? "" })) });
      if (!validation.ok) throw new Error(`Invalid curriculum: ${validation.issues.map(issue => issue.code).join(", ")}`);
      const foundation = validation.foundation;
      const sourceIds = new Map<string, string>();
      const conceptRows = await tx.select().from(concepts);
      const conceptIds = new Map(conceptRows.map(concept => [concept.stableId, concept.id]));
      const stableConceptIds = new Map(conceptRows.map(concept => [concept.id, concept.stableId]));
      const existingEdges = await tx.select().from(conceptPrerequisites).where(eq(conceptPrerequisites.trackId, trackId));
      const combinedEdges = [
        ...existingEdges.map(edge => [stableConceptIds.get(edge.conceptId)!, stableConceptIds.get(edge.prerequisiteConceptId)!] as const),
        ...foundation.prerequisites.map(edge => [edge.conceptId, edge.prerequisiteConceptId] as const)
      ];
      if (findGraphCycles(combinedEdges).length) throw new Error("Invalid curriculum: prerequisite_cycle");
      const moduleIds = new Map(moduleRows.map(module => [module.stableId, module.id]));
      for (const source of foundation.sources) {
        const contentHash = hashCanonicalJson(source);
        await tx.insert(contentSources).values({ stableId: source.id, type: source.type, title: source.title, locator: source.locator, metadata: source.metadata, contentHash }).onConflictDoNothing();
        const [row] = await tx.select().from(contentSources).where(eq(contentSources.stableId, source.id));
        if (!row || row.contentHash !== contentHash) throw new CurriculumConflictError();
        sourceIds.set(source.id, row.id);
      }
      for (const setting of foundation.settings) {
        const conceptId = conceptIds.get(setting.conceptId)!;
        const moduleId = moduleIds.get(setting.moduleId)!;
        await tx.insert(trackConceptSettings).values({ trackId, conceptId, moduleId, subjectCode: setting.subjectCode, importance: setting.importance }).onConflictDoNothing();
        const [row] = await tx.select().from(trackConceptSettings).where(and(eq(trackConceptSettings.trackId, trackId), eq(trackConceptSettings.conceptId, conceptId)));
        if (!row || row.moduleId !== moduleId || row.subjectCode !== setting.subjectCode || row.importance !== setting.importance) throw new CurriculumConflictError();
      }
      const requirementIds = new Map<string, string>();
      const inserted = new Set<string>();
      for (const requirement of foundation.requirements) {
        const [created] = await tx.insert(curriculumRequirements).values({ trackId, stableId: requirement.id, label: requirement.label, subjectCode: requirement.subjectCode, sourceId: sourceIds.get(requirement.sourceId)!, sourceLocator: requirement.sourceLocator }).onConflictDoNothing().returning();
        const [row] = created ? [created] : await tx.select().from(curriculumRequirements).where(and(eq(curriculumRequirements.trackId, trackId), eq(curriculumRequirements.stableId, requirement.id)));
        if (!row || row.label !== requirement.label || row.subjectCode !== requirement.subjectCode || row.sourceId !== sourceIds.get(requirement.sourceId) || hashCanonicalJson(row.sourceLocator) !== hashCanonicalJson(requirement.sourceLocator)) throw new CurriculumConflictError();
        requirementIds.set(requirement.id, row.id);
        if (created) inserted.add(requirement.id);
      }
      for (const requirement of foundation.requirements) {
        const requirementId = requirementIds.get(requirement.id)!;
        const parentId = requirement.parentId ? requirementIds.get(requirement.parentId)! : null;
        if (inserted.has(requirement.id)) {
          if (parentId) await tx.update(curriculumRequirements).set({ parentId }).where(eq(curriculumRequirements.id, requirementId));
          for (const id of requirement.mappedConceptIds) await tx.insert(curriculumRequirementConcepts).values({ trackId, requirementId, conceptId: conceptIds.get(id)! });
        } else {
          const [row] = await tx.select().from(curriculumRequirements).where(eq(curriculumRequirements.id, requirementId));
          const mappings = await tx.select().from(curriculumRequirementConcepts).where(eq(curriculumRequirementConcepts.requirementId, requirementId));
          const incoming = requirement.mappedConceptIds.map(id => conceptIds.get(id)!).sort();
          if (row.parentId !== parentId || hashCanonicalJson(mappings.map(mapping => mapping.conceptId).sort()) !== hashCanonicalJson(incoming)) throw new CurriculumConflictError();
        }
        await tx.insert(contentSourceLinks).values({ trackId, sourceId: sourceIds.get(requirement.sourceId)!, targetType: "requirement", targetStableId: requirement.id, targetVersion: String(track.contentVersion) }).onConflictDoNothing();
      }
      for (const edge of foundation.prerequisites) {
        const conceptId = conceptIds.get(edge.conceptId)!;
        const prerequisiteConceptId = conceptIds.get(edge.prerequisiteConceptId)!;
        await tx.insert(conceptPrerequisites).values({ trackId, conceptId, prerequisiteConceptId, strength: edge.strength }).onConflictDoNothing();
        const [row] = await tx.select().from(conceptPrerequisites).where(and(eq(conceptPrerequisites.trackId, trackId), eq(conceptPrerequisites.conceptId, conceptId), eq(conceptPrerequisites.prerequisiteConceptId, prerequisiteConceptId)));
        if (!row || row.strength !== edge.strength) throw new CurriculumConflictError();
      }
      return { requirements: foundation.requirements.length, concepts: foundation.settings.length, prerequisites: foundation.prerequisites.length };
    });
  }

  async getCoverage(trackId: string) {
    const rows = await this.db.select().from(curriculumRequirements).where(eq(curriculumRequirements.trackId, trackId));
    const mappings = await this.db.select({ requirementId: curriculumRequirementConcepts.requirementId, conceptId: concepts.stableId })
      .from(curriculumRequirementConcepts).innerJoin(concepts, eq(concepts.id, curriculumRequirementConcepts.conceptId)).where(eq(curriculumRequirementConcepts.trackId, trackId));
    const [track]=await this.db.select().from(tracks).where(eq(tracks.id,trackId));
    const [scopeRelease]=track?await this.db.select().from(contentReleases).where(and(eq(contentReleases.targetType,"curriculum"),eq(contentReleases.stableId,track.stableId),eq(contentReleases.version,track.contentVersion),eq(contentReleases.status,"published"))):[];
    const readiness=await this.db.select({conceptId:concepts.stableId,metadata:lessons.metadata}).from(lessonConcepts).innerJoin(concepts,eq(concepts.id,lessonConcepts.conceptId)).innerJoin(lessons,eq(lessons.id,lessonConcepts.lessonId)).innerJoin(modules,eq(modules.id,lessons.moduleId)).where(eq(modules.trackId,trackId));
    const publishedReleases=new Set((await this.db.select({id:contentReleases.id}).from(contentReleases).where(eq(contentReleases.status,"published"))).map(row=>row.id));
    const readyIds=new Set(readiness.filter(row=>{const meta=row.metadata as {status?:string;qaReleaseId?:string};return meta.status==="published"&&meta.qaReleaseId&&publishedReleases.has(meta.qaReleaseId);}).map(row=>row.conceptId));
    const facts=[...readyIds].map(conceptId=>({conceptId,published:true,plannerReady:true,qaApproved:true}));
    const requirements = rows.map(row => {
      const mappedConceptIds = mappings.filter(mapping => mapping.requirementId === row.id).map(mapping => mapping.conceptId).sort();
      const state = deriveRequirementCoverage(mappedConceptIds, facts, Boolean(scopeRelease));
      return { id: row.stableId, label: row.label, subjectCode: row.subjectCode, mappedConceptIds, state, contentGaps: mappedConceptIds.filter(id=>!readyIds.has(id)) };
    }).sort((a, b) => a.id.localeCompare(b.id));
    return { requirements, summary: summarizeCurriculum(requirements, Boolean(scopeRelease)) };
  }
}
