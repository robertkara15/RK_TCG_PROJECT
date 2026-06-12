CREATE TABLE "album_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"page" integer DEFAULT 0 NOT NULL,
	"slot" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "album_entries_page_slot" UNIQUE("album_id","page","slot"),
	CONSTRAINT "album_entries_album_card" UNIQUE("album_id","card_id"),
	CONSTRAINT "album_entries_page_non_negative" CHECK ("album_entries"."page" >= 0),
	CONSTRAINT "album_entries_slot_range" CHECK ("album_entries"."slot" >= 0 AND "album_entries"."slot" <= 8)
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_card_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"category" text NOT NULL,
	"image_url" text,
	"local_id" text NOT NULL,
	"set_id" text NOT NULL,
	"rarity" text,
	"illustrator" text,
	"regulation_mark" text,
	"legal_standard_print" boolean,
	"name_is_standard_legal" boolean DEFAULT false NOT NULL,
	"is_ace_spec" boolean DEFAULT false NOT NULL,
	"is_basic_energy" boolean DEFAULT false NOT NULL,
	"hp" integer,
	"types" jsonb,
	"stage" text,
	"evolve_from" text,
	"dex_ids" jsonb,
	"attacks" jsonb,
	"abilities" jsonb,
	"weaknesses" jsonb,
	"resistances" jsonb,
	"retreat" integer,
	"description" text,
	"trainer_type" text,
	"effect" text,
	"energy_type" text,
	"variants" jsonb,
	"tcgdex_updated_at" timestamp with time zone,
	"catalog_synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_entries_user_card" UNIQUE("user_id","card_id"),
	CONSTRAINT "collection_quantity_positive" CHECK ("collection_entries"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "deck_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"card_name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "deck_cards_deck_name" UNIQUE("deck_id","normalized_name"),
	CONSTRAINT "deck_cards_quantity_range" CHECK ("deck_cards"."quantity" > 0 AND "deck_cards"."quantity" <= 99)
);
--> statement-breakpoint
CREATE TABLE "deck_tags" (
	"deck_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "deck_tags_deck_id_tag_id_pk" PRIMARY KEY("deck_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"folder_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "folders_user_name" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "format_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"format" text DEFAULT 'standard' NOT NULL,
	"legal_marks" text[] DEFAULT '{H,I,J}' NOT NULL,
	"accept_future_marks" boolean DEFAULT true NOT NULL,
	"rotation_effective_date" date,
	CONSTRAINT "format_config_singleton" CHECK ("format_config"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"series" text,
	"logo_url" text,
	"symbol_url" text,
	"official_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"release_date" date,
	"catalog_synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync_metadata" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"last_full_sync_at" timestamp with time zone,
	"last_sync_status" text DEFAULT 'idle',
	"last_sync_error" text,
	"cards_synced_count" integer DEFAULT 0,
	CONSTRAINT "sync_metadata_singleton" CHECK ("sync_metadata"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	CONSTRAINT "tags_user_name" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "album_entries" ADD CONSTRAINT "album_entries_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_entries" ADD CONSTRAINT "album_entries_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_cover_card_id_cards_id_fk" FOREIGN KEY ("cover_card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_set_id_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_entries" ADD CONSTRAINT "collection_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_entries" ADD CONSTRAINT "collection_entries_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_tags" ADD CONSTRAINT "deck_tags_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_tags" ADD CONSTRAINT "deck_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_album_entries_album" ON "album_entries" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "idx_cards_normalized_name" ON "cards" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "idx_cards_set_id" ON "cards" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "idx_cards_category" ON "cards" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_cards_name_standard" ON "cards" USING btree ("name_is_standard_legal");--> statement-breakpoint
CREATE INDEX "idx_cards_set_local" ON "cards" USING btree ("set_id","local_id");--> statement-breakpoint
CREATE INDEX "idx_collection_user" ON "collection_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_collection_card" ON "collection_entries" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_deck_cards_deck" ON "deck_cards" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "idx_decks_user" ON "decks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_decks_folder" ON "decks" USING btree ("folder_id");