import { integer, jsonb, pgTable, text, timestamp, uuid, primaryKey, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { owners } from "./user-state";

export const lessonResumes = pgTable("lesson_resumes", {
  ownerId: text("owner_id").notNull().references(() => owners.id),
  contextKey: text("context_key").notNull(), trackId: text("track_id").notNull(), lessonId: text("lesson_id").notNull(), version: integer("version").notNull(),
  revision: integer("revision").notNull(), mutationId: uuid("mutation_id").notNull(), mutationHash: text("mutation_hash").notNull(),
  data: jsonb("data").notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, table => [primaryKey({ columns: [table.ownerId, table.contextKey, table.trackId, table.lessonId, table.version] }),
  index("lesson_resumes_owner_updated_idx").on(table.ownerId, table.updatedAt),
  check("lesson_resumes_version_revision_positive", sql`${table.version} > 0 AND ${table.revision} > 0`)]);
