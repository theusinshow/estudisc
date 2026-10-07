CREATE TABLE "lesson_resumes" (
	"owner_id" text NOT NULL,
	"context_key" text NOT NULL,
	"track_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"version" integer NOT NULL,
	"revision" integer NOT NULL,
	"mutation_id" uuid NOT NULL,
	"mutation_hash" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_resumes_owner_id_context_key_track_id_lesson_id_version_pk" PRIMARY KEY("owner_id","context_key","track_id","lesson_id","version"),
	CONSTRAINT "lesson_resumes_version_revision_positive" CHECK ("lesson_resumes"."version" > 0 AND "lesson_resumes"."revision" > 0)
);
--> statement-breakpoint
ALTER TABLE "lesson_resumes" ADD CONSTRAINT "lesson_resumes_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_resumes_owner_updated_idx" ON "lesson_resumes" USING btree ("owner_id","updated_at");