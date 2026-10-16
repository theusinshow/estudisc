CREATE TABLE "assessment_sheet_responses" (
	"instance_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"answer" text,
	"flagged" integer DEFAULT 0 NOT NULL,
	"first_answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_sheet_responses_instance_id_position_pk" PRIMARY KEY("instance_id","position"),
	CONSTRAINT "assessment_sheet_answer_check" CHECK ("assessment_sheet_responses"."answer" is null or "assessment_sheet_responses"."answer" in ('A','B','C','D','E')),
	CONSTRAINT "assessment_sheet_position_check" CHECK ("assessment_sheet_responses"."position" between 1 and 28)
);
--> statement-breakpoint
ALTER TABLE "assessment_sheet_responses" ADD CONSTRAINT "assessment_sheet_responses_instance_id_assessment_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."assessment_instances"("id") ON DELETE no action ON UPDATE no action;