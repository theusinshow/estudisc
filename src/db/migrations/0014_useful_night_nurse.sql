CREATE TABLE "assessment_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"template_id" uuid NOT NULL,
	"start_key" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"mode" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"result" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"instance_id" uuid NOT NULL,
	"question_version_id" uuid NOT NULL,
	"response" jsonb NOT NULL,
	"flagged" integer DEFAULT 0 NOT NULL,
	"first_answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_responses_instance_id_question_version_id_pk" PRIMARY KEY("instance_id","question_version_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stable_id" text NOT NULL,
	"version" integer NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"content_hash" text NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "activity_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_instances" ADD CONSTRAINT "assessment_instances_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_instances" ADD CONSTRAINT "assessment_instances_template_id_assessment_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_instance_id_assessment_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."assessment_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_owner_start_idx" ON "assessment_instances" USING btree ("owner_id","start_key");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_owner_active_idx" ON "assessment_instances" USING btree ("owner_id") WHERE "assessment_instances"."status"='ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_template_version_idx" ON "assessment_templates" USING btree ("stable_id","version");