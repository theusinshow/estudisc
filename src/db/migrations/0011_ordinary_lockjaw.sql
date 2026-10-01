CREATE TABLE "question_choices" (
	"question_version_id" uuid NOT NULL,
	"stable_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"content" text NOT NULL,
	"correct" integer NOT NULL,
	"targets_error" text,
	"rationale" text,
	CONSTRAINT "question_choices_question_version_id_stable_id_pk" PRIMARY KEY("question_version_id","stable_id"),
	CONSTRAINT "choice_correct_boolean" CHECK ("question_choices"."correct" in (0, 1))
);
--> statement-breakpoint
CREATE TABLE "question_concepts" (
	"question_version_id" uuid NOT NULL,
	"concept_id" uuid NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "question_concepts_question_version_id_concept_id_pk" PRIMARY KEY("question_version_id","concept_id"),
	CONSTRAINT "question_concept_role" CHECK ("question_concepts"."role" in ('primary', 'secondary'))
);
--> statement-breakpoint
CREATE TABLE "question_exposures" (
	"owner_id" text NOT NULL,
	"question_id" uuid NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"times_seen" integer NOT NULL,
	"last_context" text NOT NULL,
	CONSTRAINT "question_exposures_owner_id_question_id_pk" PRIMARY KEY("owner_id","question_id"),
	CONSTRAINT "question_exposure_nonnegative" CHECK ("question_exposures"."times_seen" >= 0)
);
--> statement-breakpoint
CREATE TABLE "question_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"subject_code" text NOT NULL,
	"type" text NOT NULL,
	"difficulty" text NOT NULL,
	"status" text NOT NULL,
	"content_hash" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_version_positive" CHECK ("question_versions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stable_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "question_choices" ADD CONSTRAINT "question_choices_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_concepts" ADD CONSTRAINT "question_concepts_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_concepts" ADD CONSTRAINT "question_concepts_concept_id_concepts_id_fk" FOREIGN KEY ("concept_id") REFERENCES "public"."concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_exposures" ADD CONSTRAINT "question_exposures_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_exposures" ADD CONSTRAINT "question_exposures_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "question_versions_identity_idx" ON "question_versions" USING btree ("question_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_stable_idx" ON "questions" USING btree ("stable_id");