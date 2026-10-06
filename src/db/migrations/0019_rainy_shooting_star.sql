CREATE TABLE "study_plan_previews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"base_revision" integer NOT NULL,
	"settings" jsonb NOT NULL,
	"snapshot" jsonb NOT NULL,
	"dependency_hash" text NOT NULL,
	"policy_version" text DEFAULT 'routine.v1' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"applied_revision" integer,
	"applied_at" timestamp with time zone,
	CONSTRAINT "study_plan_previews_revision_nonnegative" CHECK ("study_plan_previews"."base_revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "study_plans" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"revision" integer NOT NULL,
	"settings" jsonb NOT NULL,
	"policy_version" text DEFAULT 'routine.v1' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_plans_revision_positive" CHECK ("study_plans"."revision" > 0)
);
--> statement-breakpoint
ALTER TABLE "study_plan_previews" ADD CONSTRAINT "study_plan_previews_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_plan_previews_owner_created_idx" ON "study_plan_previews" USING btree ("owner_id","created_at");