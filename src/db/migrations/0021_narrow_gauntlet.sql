CREATE TABLE "billing_checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"product_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_preference_id" text,
	"amount_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"product_id" text NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"checkout_id" uuid,
	"provider_payment_id" text,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_checkouts" ADD CONSTRAINT "billing_checkouts_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_checkout_id_billing_checkouts_id_fk" FOREIGN KEY ("checkout_id") REFERENCES "public"."billing_checkouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_checkouts_owner_idx" ON "billing_checkouts" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "entitlements_owner_product_idx" ON "entitlements" USING btree ("owner_id","product_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_payment_status_idx" ON "entitlements" USING btree ("source","provider_payment_id","status");