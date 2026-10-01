import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { owners } from "./user-state";
import { tracks } from "./content";
import { questionVersions } from "./questions";

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(), ownerId:text("owner_id").notNull().references(()=>owners.id),
  trackId:uuid("track_id").notNull().references(()=>tracks.id), status:text("status").notNull().default("PLANNED"),
  budgetMinutes:integer("budget_minutes").notNull(), items:jsonb("items").notNull(),
  policyVersion:text("policy_version").notNull(), startedAt:timestamp("started_at",{withTimezone:true}),
  endedAt:timestamp("ended_at",{withTimezone:true}), createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
});
export const questionAssistance = pgTable("question_assistance", {
  id:uuid("id").primaryKey().defaultRandom(), ownerId:text("owner_id").notNull().references(()=>owners.id),
  questionVersionId:uuid("question_version_id").notNull().references(()=>questionVersions.id),
  contextKey:text("context_key").notNull(), hintLevel:integer("hint_level").notNull().default(0),
  solutionRevealed:integer("solution_revealed").notNull().default(0),
  updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
},table=>[uniqueIndex("question_assistance_owner_question_context_idx").on(table.ownerId,table.questionVersionId,table.contextKey)]);
