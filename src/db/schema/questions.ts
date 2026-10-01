import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { concepts } from "./content";
import { owners } from "./user-state";

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(), stableId: text("stable_id").notNull()
}, table => [uniqueIndex("questions_stable_idx").on(table.stableId)]);

export const questionVersions = pgTable("question_versions", {
  id: uuid("id").primaryKey().defaultRandom(), questionId: uuid("question_id").notNull().references(() => questions.id),
  version: integer("version").notNull(), subjectCode: text("subject_code").notNull(), type: text("type").notNull(), difficulty: text("difficulty").notNull(),
  status: text("status").notNull(), contentHash: text("content_hash").notNull(), content: jsonb("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, table => [uniqueIndex("question_versions_identity_idx").on(table.questionId, table.version), check("question_version_positive", sql`${table.version} > 0`)]);

export const questionChoices = pgTable("question_choices", {
  questionVersionId: uuid("question_version_id").notNull().references(() => questionVersions.id), stableId: text("stable_id").notNull(),
  orderIndex: integer("order_index").notNull(), content: text("content").notNull(), correct: integer("correct").notNull(),
  targetsError: text("targets_error"), rationale: text("rationale")
}, table => [primaryKey({ columns: [table.questionVersionId, table.stableId] }), check("choice_correct_boolean", sql`${table.correct} in (0, 1)`)]);

export const questionConcepts = pgTable("question_concepts", {
  questionVersionId: uuid("question_version_id").notNull().references(() => questionVersions.id), conceptId: uuid("concept_id").notNull().references(() => concepts.id), role: text("role").notNull()
}, table => [primaryKey({ columns: [table.questionVersionId, table.conceptId] }), check("question_concept_role", sql`${table.role} in ('primary', 'secondary')`)]);

export const questionExposures = pgTable("question_exposures", {
  ownerId: text("owner_id").notNull().references(() => owners.id), questionId: uuid("question_id").notNull().references(() => questions.id),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(), lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(), timesSeen: integer("times_seen").notNull(), lastContext: text("last_context").notNull()
}, table => [primaryKey({ columns: [table.ownerId, table.questionId] }), check("question_exposure_nonnegative", sql`${table.timesSeen} >= 0`)]);
