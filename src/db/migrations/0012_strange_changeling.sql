CREATE TABLE "question_assistance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"question_version_id" uuid NOT NULL,
	"context_key" text NOT NULL,
	"hint_level" integer DEFAULT 0 NOT NULL,
	"solution_revealed" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"track_id" uuid NOT NULL,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"budget_minutes" integer NOT NULL,
	"items" jsonb NOT NULL,
	"policy_version" text NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "submission_key" text;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "question_version_id" uuid;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "context" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "question_assistance" ADD CONSTRAINT "question_assistance_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_assistance" ADD CONSTRAINT "question_assistance_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "question_assistance_owner_question_context_idx" ON "question_assistance" USING btree ("owner_id","question_version_id","context_key");--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_owner_submission_idx" ON "attempts" USING btree ("owner_id","submission_key");