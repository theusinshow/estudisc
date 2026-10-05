CREATE TABLE "content_publication_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"mode" text DEFAULT 'admin_direct' NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_publication_events" ADD CONSTRAINT "content_publication_events_release_id_content_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."content_releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_publication_event_release_idx" ON "content_publication_events" USING btree ("release_id");