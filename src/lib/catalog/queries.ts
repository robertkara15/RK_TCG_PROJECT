import { and, asc, count, desc, eq, ilike, isNull, like, not, notInArray, or, sql } from "drizzle-orm";

import { POCKET_SET_IDS } from "@/lib/catalog/pocket";
import { db } from "@/lib/db";
import { cards, sets } from "@/lib/db/schema";

const POCKET_SET_ID_LIST = [...POCKET_SET_IDS];

function physicalCardsFilter() {
  return and(
    notInArray(cards.setId, POCKET_SET_ID_LIST),
    or(isNull(cards.imageUrl), not(like(cards.imageUrl, "%/tcgp/%"))),
  );
}

function physicalSetsFilter() {
  return notInArray(sets.id, POCKET_SET_ID_LIST);
}

export type CardListParams = {
  q?: string;
  set?: string;
  category?: string;
  standardLegal?: boolean;
  page?: number;
  limit?: number;
};

export async function searchCards({
  q,
  set,
  category,
  standardLegal,
  page = 1,
  limit = 40,
}: CardListParams) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const offset = (Math.max(page, 1) - 1) * safeLimit;

  const filters = [physicalCardsFilter()];

  if (q) {
    filters.push(ilike(cards.normalizedName, `%${q.trim().toLowerCase()}%`));
  }

  if (set) {
    filters.push(eq(cards.setId, set));
  }

  if (category) {
    filters.push(eq(cards.category, category));
  }

  if (standardLegal === true) {
    filters.push(eq(cards.nameIsStandardLegal, true));
  }

  const whereClause = and(...filters);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: cards.id,
        name: cards.name,
        imageUrl: cards.imageUrl,
        localId: cards.localId,
        regulationMark: cards.regulationMark,
        legalStandardPrint: cards.legalStandardPrint,
        nameIsStandardLegal: cards.nameIsStandardLegal,
        category: cards.category,
        set: {
          id: sets.id,
          name: sets.name,
        },
      })
      .from(cards)
      .innerJoin(sets, eq(cards.setId, sets.id))
      .where(whereClause)
      .orderBy(asc(cards.name), asc(cards.localId))
      .limit(safeLimit)
      .offset(offset),
    db.select({ value: count() }).from(cards).where(whereClause),
  ]);

  return {
    data: rows,
    pagination: {
      page,
      limit: safeLimit,
      total: totalRow[0]?.value ?? 0,
    },
  };
}

export async function getCardById(cardId: string) {
  const [row] = await db
    .select({
      card: cards,
      set: sets,
    })
    .from(cards)
    .innerJoin(sets, eq(cards.setId, sets.id))
    .where(and(eq(cards.id, cardId), physicalCardsFilter(), physicalSetsFilter()))
    .limit(1);

  return row ?? null;
}

export async function getOtherPrints(cardId: string, normalizedName: string) {
  return db
    .select({
      id: cards.id,
      name: cards.name,
      imageUrl: cards.imageUrl,
      localId: cards.localId,
      setId: cards.setId,
      setName: sets.name,
      releaseDate: sets.releaseDate,
      nameIsStandardLegal: cards.nameIsStandardLegal,
      legalStandardPrint: cards.legalStandardPrint,
    })
    .from(cards)
    .innerJoin(sets, eq(cards.setId, sets.id))
    .where(
      and(
        eq(cards.normalizedName, normalizedName),
        sql`${cards.id} <> ${cardId}`,
        physicalCardsFilter(),
        physicalSetsFilter(),
      ),
    )
    .orderBy(desc(sets.releaseDate), asc(cards.localId));
}

export async function listSets() {
  return db
    .select()
    .from(sets)
    .where(physicalSetsFilter())
    .orderBy(desc(sets.releaseDate), asc(sets.name));
}

export async function getSetById(setId: string) {
  if (POCKET_SET_IDS.has(setId)) {
    return null;
  }

  const [row] = await db
    .select()
    .from(sets)
    .where(and(eq(sets.id, setId), physicalSetsFilter()))
    .limit(1);

  return row ?? null;
}
