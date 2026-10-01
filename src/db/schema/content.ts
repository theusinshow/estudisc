import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const packImports = pgTable(
  "pack_imports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schema: text("schema").notNull(),
    packId: text("pack_id").notNull(),
    version: integer("version").notNull(),
    contentHash: text("content_hash").notNull(),
    status: text("status").notNull(),
    manifest: jsonb("manifest").notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("pack_imports_pack_version_idx").on(table.packId, table.version)]
);

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stableId: text("stable_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    packImportId: uuid("pack_import_id")
      .notNull()
      .references(() => packImports.id),
    contentVersion: integer("content_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("tracks_stable_version_idx").on(table.stableId, table.contentVersion)]
);

export const modules = pgTable(
  "modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stableId: text("stable_id").notNull(),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id),
    title: text("title").notNull(),
    subjectCode: text("subject_code"),
    orderIndex: integer("order_index").notNull()
  },
  (table) => [uniqueIndex("modules_track_stable_idx").on(table.trackId, table.stableId), unique("modules_track_id_unique").on(table.trackId, table.id)]
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stableId: text("stable_id").notNull(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id),
    title: text("title").notNull(),
    contentVersion: integer("content_version").notNull(),
    orderIndex: integer("order_index").notNull()
  },
  (table) => [uniqueIndex("lessons_stable_version_idx").on(table.stableId, table.contentVersion)]
);

export const concepts = pgTable(
  "concepts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stableId: text("stable_id").notNull(),
    title: text("title").notNull(),
    summary: text("summary")
  },
  (table) => [uniqueIndex("concepts_stable_idx").on(table.stableId)]
);

export const lessonConcepts = pgTable(
  "lesson_concepts",
  {
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id)
  },
  (table) => [primaryKey({ columns: [table.lessonId, table.conceptId] })]
);

export const contentBlocks = pgTable(
  "content_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stableId: text("stable_id").notNull(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id),
    type: text("type").notNull(),
    orderIndex: integer("order_index").notNull(),
    payload: jsonb("payload").notNull()
  },
  (table) => [uniqueIndex("content_blocks_lesson_stable_idx").on(table.lessonId, table.stableId)]
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stableId: text("stable_id").notNull(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id),
    type: text("type").notNull(),
    prompt: text("prompt").notNull(),
    orderIndex: integer("order_index").notNull(),
    config: jsonb("config").notNull(),
    evaluatorVersion: text("evaluator_version").notNull()
  },
  (table) => [uniqueIndex("activities_lesson_stable_idx").on(table.lessonId, table.stableId)]
);
