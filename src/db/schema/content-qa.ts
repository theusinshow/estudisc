import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
export const contentReleases = pgTable("content_releases", {
  id: uuid("id").primaryKey().defaultRandom(), targetType: text("target_type").notNull(),
  stableId: text("stable_id").notNull(), version: integer("version").notNull(),
  contentHash: text("content_hash").notNull(), authorId: text("author_id").notNull(),
  status: text("status").notNull().default("draft"), createdAt: timestamp("created_at", {withTimezone:true}).notNull().defaultNow()
}, table => [uniqueIndex("content_release_identity_idx").on(table.targetType,table.stableId,table.version)]);
export const contentQaReviews = pgTable("content_qa_reviews", {
  id: uuid("id").primaryKey().defaultRandom(), releaseId: uuid("release_id").notNull().references(()=>contentReleases.id),
  reviewerId: text("reviewer_id").notNull(), layer: text("layer").notNull(), verdict: text("verdict").notNull(),
  findings: jsonb("findings").notNull(), rationale: text("rationale").notNull(),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
});

// Administrative publication decisions are separate from editorial reviews.
export const contentPublicationEvents = pgTable("content_publication_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  releaseId: uuid("release_id").notNull().references(() => contentReleases.id),
  actorId: text("actor_id").notNull(),
  mode: text("mode").notNull().default("admin_direct"),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, table => [uniqueIndex("content_publication_event_release_idx").on(table.releaseId)]);
