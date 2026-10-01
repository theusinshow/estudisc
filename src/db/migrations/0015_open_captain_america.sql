CREATE TABLE "question_assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"question_version_id" uuid NOT NULL,
	"content_hash" text NOT NULL,
	"mime_type" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question_assets" ADD CONSTRAINT "question_assets_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "question_asset_identity_hash_idx" ON "question_assets" USING btree ("id","content_hash");