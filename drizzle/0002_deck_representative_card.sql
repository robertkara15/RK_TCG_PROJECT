ALTER TABLE "deck_cards" ADD COLUMN "representative_card_id" text;
--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_representative_card_id_cards_id_fk" FOREIGN KEY ("representative_card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;
