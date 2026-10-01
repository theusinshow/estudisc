import { sql } from "drizzle-orm";
import { check, foreignKey, index, jsonb, pgTable, primaryKey, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { concepts, modules, tracks } from "./content";

export const contentSources = pgTable("content_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  stableId: text("stable_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  locator: jsonb("locator").notNull(),
  metadata: jsonb("metadata").notNull(),
  contentHash: text("content_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, table => [
  uniqueIndex("content_sources_stable_idx").on(table.stableId),
  check("content_sources_type_check", sql`${table.type} in ('official_curriculum', 'official_exam', 'reference', 'human_created', 'ai_generated')`)
]);

export const trackConceptSettings = pgTable("track_concept_settings", {
  trackId: uuid("track_id").notNull().references(() => tracks.id),
  conceptId: uuid("concept_id").notNull().references(() => concepts.id),
  moduleId: uuid("module_id").notNull(),
  subjectCode: text("subject_code").notNull(),
  importance: text("importance").notNull(),
  status: text("status").notNull().default("active")
}, table => [
  primaryKey({ columns: [table.trackId, table.conceptId] }),
  foreignKey({ columns: [table.trackId, table.moduleId], foreignColumns: [modules.trackId, modules.id], name: "track_concept_module_track_fk" }),
  check("track_concept_importance_check", sql`${table.importance} in ('low', 'medium', 'high', 'critical')`),
  check("track_concept_status_check", sql`${table.status} in ('active', 'retired')`)
]);

export const curriculumRequirements = pgTable("curriculum_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackId: uuid("track_id").notNull().references(() => tracks.id),
  stableId: text("stable_id").notNull(),
  subjectCode: text("subject_code").notNull(),
  parentId: uuid("parent_id"),
  label: text("label").notNull(),
  sourceId: uuid("source_id").notNull().references(() => contentSources.id),
  sourceLocator: jsonb("source_locator").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, table => [
  uniqueIndex("curriculum_requirements_track_stable_idx").on(table.trackId, table.stableId),
  unique("curriculum_requirements_track_id_unique").on(table.trackId, table.id),
  foreignKey({ columns: [table.trackId, table.parentId], foreignColumns: [table.trackId, table.id], name: "curriculum_parent_same_track_fk" }),
  check("curriculum_parent_not_self", sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`)
]);

export const curriculumRequirementConcepts = pgTable("curriculum_requirement_concepts", {
  trackId: uuid("track_id").notNull(),
  requirementId: uuid("requirement_id").notNull(),
  conceptId: uuid("concept_id").notNull()
}, table => [
  primaryKey({ columns: [table.requirementId, table.conceptId] }),
  foreignKey({ columns: [table.trackId, table.requirementId], foreignColumns: [curriculumRequirements.trackId, curriculumRequirements.id], name: "curriculum_mapping_requirement_track_fk" }),
  foreignKey({ columns: [table.trackId, table.conceptId], foreignColumns: [trackConceptSettings.trackId, trackConceptSettings.conceptId], name: "curriculum_mapping_concept_track_fk" })
]);

export const conceptPrerequisites = pgTable("concept_prerequisites", {
  trackId: uuid("track_id").notNull(),
  conceptId: uuid("concept_id").notNull(),
  prerequisiteConceptId: uuid("prerequisite_concept_id").notNull(),
  strength: text("strength").notNull()
}, table => [
  primaryKey({ columns: [table.trackId, table.conceptId, table.prerequisiteConceptId] }),
  foreignKey({ columns: [table.trackId, table.conceptId], foreignColumns: [trackConceptSettings.trackId, trackConceptSettings.conceptId], name: "prerequisite_target_track_fk" }),
  foreignKey({ columns: [table.trackId, table.prerequisiteConceptId], foreignColumns: [trackConceptSettings.trackId, trackConceptSettings.conceptId], name: "prerequisite_source_track_fk" }),
  check("prerequisite_not_self", sql`${table.conceptId} <> ${table.prerequisiteConceptId}`),
  check("prerequisite_strength_check", sql`${table.strength} in ('required', 'recommended')`)
]);

export const contentSourceLinks = pgTable("content_source_links", {
  trackId: uuid("track_id").notNull().references(() => tracks.id),
  sourceId: uuid("source_id").notNull().references(() => contentSources.id),
  targetType: text("target_type").notNull(),
  targetStableId: text("target_stable_id").notNull(),
  targetVersion: text("target_version").notNull()
}, table => [
  primaryKey({ columns: [table.trackId, table.sourceId, table.targetType, table.targetStableId, table.targetVersion] }),
  index("source_links_target_idx").on(table.trackId, table.targetType, table.targetStableId),
  check("source_links_target_type_check", sql`${table.targetType} in ('requirement', 'lesson', 'question')`)
]);
