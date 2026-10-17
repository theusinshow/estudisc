CREATE TABLE "account_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider" text NOT NULL,
	"subject" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_identities_provider_check" CHECK ("account_identities"."provider" in ('email', 'google', 'legacy_code'))
);
--> statement-breakpoint
CREATE TABLE "email_login_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"intent" text NOT NULL,
	"account_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_login_codes_intent_check" CHECK ("email_login_codes"."intent" in ('signin', 'signup', 'link')),
	CONSTRAINT "email_login_codes_attempts_check" CHECK ("email_login_codes"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"name" text NOT NULL,
	"role" text DEFAULT 'STUDENT' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"terms_version" text,
	"terms_accepted_at" timestamp with time zone,
	"guardian_declaration" jsonb,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sign_in_at" timestamp with time zone,
	CONSTRAINT "user_accounts_role_check" CHECK ("user_accounts"."role" in ('ADMIN', 'STUDENT')),
	CONSTRAINT "user_accounts_status_check" CHECK ("user_accounts"."status" in ('active', 'disabled')),
	CONSTRAINT "user_accounts_email_lowercase" CHECK ("user_accounts"."email" is null or "user_accounts"."email" = lower("user_accounts"."email"))
);
--> statement-breakpoint
ALTER TABLE "account_identities" ADD CONSTRAINT "account_identities_account_id_user_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_login_codes" ADD CONSTRAINT "email_login_codes_account_id_user_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_id_owners_id_fk" FOREIGN KEY ("id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_identities_provider_subject_idx" ON "account_identities" USING btree ("provider","subject");--> statement-breakpoint
CREATE INDEX "account_identities_account_idx" ON "account_identities" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "email_login_codes_email_created_idx" ON "email_login_codes" USING btree ("email","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_accounts_email_idx" ON "user_accounts" USING btree ("email");