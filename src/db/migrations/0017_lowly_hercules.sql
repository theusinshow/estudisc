DROP INDEX "lessons_stable_version_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_module_stable_version_idx" ON "lessons" USING btree ("module_id","stable_id","content_version");