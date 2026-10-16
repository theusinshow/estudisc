CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"product_id" text NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"provider_payment_id" text,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_status_check" CHECK ("entitlements"."status" in ('granted', 'refunded', 'revoked')),
	CONSTRAINT "entitlements_amount_non_negative" CHECK ("entitlements"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"product_id" text NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_codes_uses_valid" CHECK ("invite_codes"."max_uses" > 0 AND "invite_codes"."used_count" >= 0 AND "invite_codes"."used_count" <= "invite_codes"."max_uses")
);
--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entitlements_owner_product_created_idx" ON "entitlements" USING btree ("owner_id","product_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_provider_payment_status_idx" ON "entitlements" USING btree ("provider_payment_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_codes_code_idx" ON "invite_codes" USING btree ("code");