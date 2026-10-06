import { integer, jsonb, pgTable, text, timestamp, uuid, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { owners } from "./user-state";

export const studyPlans = pgTable("study_plans", {
  ownerId: text("owner_id").primaryKey().references(() => owners.id),
  revision: integer("revision").notNull(), settings: jsonb("settings").notNull(),
  policyVersion: text("policy_version").notNull().default("routine.v1"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, table => [check("study_plans_revision_positive", sql`${table.revision} > 0`)]);

export const studyPlanPreviews = pgTable("study_plan_previews", {
  id: uuid("id").primaryKey(), ownerId: text("owner_id").notNull().references(() => owners.id),
  baseRevision: integer("base_revision").notNull(), settings: jsonb("settings").notNull(), snapshot: jsonb("snapshot").notNull(),
  dependencyHash: text("dependency_hash").notNull(), policyVersion: text("policy_version").notNull().default("routine.v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  appliedRevision: integer("applied_revision"), appliedAt: timestamp("applied_at", { withTimezone: true })
}, table => [index("study_plan_previews_owner_created_idx").on(table.ownerId, table.createdAt), check("study_plan_previews_revision_nonnegative", sql`${table.baseRevision} >= 0`)]);
