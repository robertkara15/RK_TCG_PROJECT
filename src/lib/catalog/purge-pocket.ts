import { inArray, like, or } from "drizzle-orm";

import { POCKET_SET_IDS } from "@/lib/catalog/pocket";
import { db } from "@/lib/db";
import { cards, sets } from "@/lib/db/schema";

export async function purgePocketCatalog() {
  const pocketSetIds = [...POCKET_SET_IDS];

  await db
    .delete(cards)
    .where(
      or(inArray(cards.setId, pocketSetIds), like(cards.imageUrl, "%/tcgp/%")),
    );

  await db.delete(sets).where(inArray(sets.id, pocketSetIds));
}
