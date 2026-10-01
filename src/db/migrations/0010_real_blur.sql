ALTER TABLE "modules" ADD CONSTRAINT "modules_track_id_unique" UNIQUE("track_id","id");
--> statement-breakpoint
CREATE TABLE "concept_prerequisites" (
	"track_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"prerequisite_concept_id" uuid NOT NULL,
	"strength" text NOT NULL,
	CONSTRAINT "concept_prerequisites_track_id_concept_id_prerequisite_concept_id_pk" PRIMARY KEY("track_id","concept_id","prerequisite_concept_id"),
	CONSTRAINT "prerequisite_not_self" CHECK ("concept_prerequisites"."concept_id" <> "concept_prerequisites"."prerequisite_concept_id"),
	CONSTRAINT "prerequisite_strength_check" CHECK ("concept_prerequisites"."strength" in ('required', 'recommended'))
);
--> statement-breakpoint
CREATE TABLE "content_source_links" (
	"track_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_stable_id" text NOT NULL,
	"target_version" text NOT NULL,
	CONSTRAINT "content_source_links_track_id_source_id_target_type_target_stable_id_target_version_pk" PRIMARY KEY("track_id","source_id","target_type","target_stable_id","target_version"),
	CONSTRAINT "source_links_target_type_check" CHECK ("content_source_links"."target_type" in ('requirement', 'lesson', 'question'))
);
--> statement-breakpoint
CREATE TABLE "content_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stable_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"locator" jsonb NOT NULL,
	"metadata" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_sources_type_check" CHECK ("content_sources"."type" in ('official_curriculum', 'official_exam', 'reference', 'human_created', 'ai_generated'))
);
--> statement-breakpoint
CREATE TABLE "curriculum_requirement_concepts" (
	"track_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	CONSTRAINT "curriculum_requirement_concepts_requirement_id_concept_id_pk" PRIMARY KEY("requirement_id","concept_id")
);
--> statement-breakpoint
CREATE TABLE "curriculum_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"stable_id" text NOT NULL,
	"subject_code" text NOT NULL,
	"parent_id" uuid,
	"label" text NOT NULL,
	"source_id" uuid NOT NULL,
	"source_locator" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_requirements_track_id_unique" UNIQUE("track_id","id"),
	CONSTRAINT "curriculum_parent_not_self" CHECK ("curriculum_requirements"."parent_id" is null or "curriculum_requirements"."parent_id" <> "curriculum_requirements"."id")
);
--> statement-breakpoint
CREATE TABLE "track_concept_settings" (
	"track_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"subject_code" text NOT NULL,
	"importance" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "track_concept_settings_track_id_concept_id_pk" PRIMARY KEY("track_id","concept_id"),
	CONSTRAINT "track_concept_importance_check" CHECK ("track_concept_settings"."importance" in ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "track_concept_status_check" CHECK ("track_concept_settings"."status" in ('active', 'retired'))
);
--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "subject_code" text;--> statement-breakpoint
ALTER TABLE "concept_prerequisites" ADD CONSTRAINT "prerequisite_target_track_fk" FOREIGN KEY ("track_id","concept_id") REFERENCES "public"."track_concept_settings"("track_id","concept_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_prerequisites" ADD CONSTRAINT "prerequisite_source_track_fk" FOREIGN KEY ("track_id","prerequisite_concept_id") REFERENCES "public"."track_concept_settings"("track_id","concept_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_source_links" ADD CONSTRAINT "content_source_links_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_source_links" ADD CONSTRAINT "content_source_links_source_id_content_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."content_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_requirement_concepts" ADD CONSTRAINT "curriculum_mapping_requirement_track_fk" FOREIGN KEY ("track_id","requirement_id") REFERENCES "public"."curriculum_requirements"("track_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_requirement_concepts" ADD CONSTRAINT "curriculum_mapping_concept_track_fk" FOREIGN KEY ("track_id","concept_id") REFERENCES "public"."track_concept_settings"("track_id","concept_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_requirements" ADD CONSTRAINT "curriculum_requirements_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_requirements" ADD CONSTRAINT "curriculum_requirements_source_id_content_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."content_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_requirements" ADD CONSTRAINT "curriculum_parent_same_track_fk" FOREIGN KEY ("track_id","parent_id") REFERENCES "public"."curriculum_requirements"("track_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_concept_settings" ADD CONSTRAINT "track_concept_settings_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_concept_settings" ADD CONSTRAINT "track_concept_settings_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_concept_settings" ADD CONSTRAINT "track_concept_module_track_fk" FOREIGN KEY ("track_id","module_id") REFERENCES "public"."modules"("track_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_links_target_idx" ON "content_source_links" USING btree ("track_id","target_type","target_stable_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_sources_stable_idx" ON "content_sources" USING btree ("stable_id");--> statement-breakpoint
CREATE UNIQUE INDEX "curriculum_requirements_track_stable_idx" ON "curriculum_requirements" USING btree ("track_id","stable_id");--> statement-breakpoint
