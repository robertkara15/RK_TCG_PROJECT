CREATE TABLE "pinned_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"set_id" text NOT NULL,
	"pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pinned_sets_user_set" UNIQUE("user_id","set_id")
);
--> statement-breakpoint
ALTER TABLE "pinned_sets" ADD CONSTRAINT "pinned_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pinned_sets" ADD CONSTRAINT "pinned_sets_set_id_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."sets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_pinned_sets_user" ON "pinned_sets" USING btree ("user_id");
