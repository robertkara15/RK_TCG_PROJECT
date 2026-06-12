import { and, asc, count, eq, notInArray, sql, sum } from "drizzle-orm";

import {
  buildCardFilterSql,
  buildCardOrderBy,
  type CardFilterParams,
  type SortOption,
} from "@/lib/catalog/filter-sort";
import { POCKET_SET_IDS } from "@/lib/catalog/pocket";
import { db } from "@/lib/db";
import { cards, collectionEntries, sets } from "@/lib/db/schema";

const POCKET_SET_ID_LIST = [...POCKET_SET_IDS];

function physicalCardsFilter() {
  return and(
    notInArray(cards.setId, POCKET_SET_ID_LIST),
    sql`(${cards.imageUrl} IS NULL OR ${cards.imageUrl} NOT LIKE '%/tcgp/%')`,
  );
}

function physicalSetsFilter() {
  return notInArray(sets.id, POCKET_SET_ID_LIST);
}

export type CardListParams = CardFilterParams & {
  sort?: SortOption;
  page?: number;
  limit?: number;
};

const cardBriefSelect = {
  id: cards.id,
  name: cards.name,
  imageUrl: cards.imageUrl,
  localId: cards.localId,
  regulationMark: cards.regulationMark,
  legalStandardPrint: cards.legalStandardPrint,
  nameIsStandardLegal: cards.nameIsStandardLegal,
  category: cards.category,
  rarity: cards.rarity,
  stage: cards.stage,
  hp: cards.hp,
  illustrator: cards.illustrator,
  set: {
    id: sets.id,
    name: sets.name,
    releaseDate: sets.releaseDate,
  },
};

export async function searchCards({
  sort = "name_asc",
  page = 1,
  limit = 40,
  ...filterParams
}: CardListParams) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const offset = (Math.max(page, 1) - 1) * safeLimit;

  const filters = [physicalCardsFilter(), ...buildCardFilterSql(filterParams)];
  const whereClause = and(...filters);
  const orderBy = buildCardOrderBy(sort);

  const [rows, totalRow] = await Promise.all([
    db
      .select(cardBriefSelect)
      .from(cards)
      .innerJoin(sets, eq(cards.setId, sets.id))
      .where(whereClause)
      .orderBy(...orderBy)
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

export type CollectionListParams = CardListParams;

export async function searchCollection(
  userId: string,
  { sort = "added_new", page = 1, limit = 40, ...filterParams }: CollectionListParams,
) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const offset = (Math.max(page, 1) - 1) * safeLimit;

  const filters = [
    eq(collectionEntries.userId, userId),
    physicalCardsFilter(),
    ...buildCardFilterSql(filterParams),
  ];
  const whereClause = and(...filters);
  const orderBy = buildCardOrderBy(sort);

  const [rows, totalRow, statsRow] = await Promise.all([
    db
      .select({
        ...cardBriefSelect,
        quantity: collectionEntries.quantity,
        entryId: collectionEntries.id,
        addedAt: collectionEntries.createdAt,
        updatedAt: collectionEntries.updatedAt,
      })
      .from(collectionEntries)
      .innerJoin(cards, eq(collectionEntries.cardId, cards.id))
      .innerJoin(sets, eq(cards.setId, sets.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(safeLimit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(collectionEntries)
      .innerJoin(cards, eq(collectionEntries.cardId, cards.id))
      .where(whereClause),
    db
      .select({
        uniqueCards: count(),
        totalCopies: sum(collectionEntries.quantity),
      })
      .from(collectionEntries)
      .innerJoin(cards, eq(collectionEntries.cardId, cards.id))
      .where(and(eq(collectionEntries.userId, userId), physicalCardsFilter())),
  ]);

  return {
    data: rows,
    stats: {
      uniqueCards: statsRow[0]?.uniqueCards ?? 0,
      totalCopies: Number(statsRow[0]?.totalCopies ?? 0),
      filteredCards: totalRow[0]?.value ?? 0,
    },
    pagination: {
      page,
      limit: safeLimit,
      total: totalRow[0]?.value ?? 0,
    },
  };
}

export async function upsertCollectionEntry(
  userId: string,
  cardId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    await db
      .delete(collectionEntries)
      .where(
        and(
          eq(collectionEntries.userId, userId),
          eq(collectionEntries.cardId, cardId),
        ),
      );
    return null;
  }

  const [row] = await db
    .insert(collectionEntries)
    .values({
      userId,
      cardId,
      quantity,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [collectionEntries.userId, collectionEntries.cardId],
      set: {
        quantity,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
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

export async function getCollectionQuantity(userId: string, cardId: string) {
  const [row] = await db
    .select({ quantity: collectionEntries.quantity })
    .from(collectionEntries)
    .where(
      and(
        eq(collectionEntries.userId, userId),
        eq(collectionEntries.cardId, cardId),
      ),
    )
    .limit(1);

  return row?.quantity ?? 0;
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
    .orderBy(sql`${sets.releaseDate} DESC NULLS LAST`, asc(cards.localId));
}

export async function listSets() {
  return db
    .select()
    .from(sets)
    .where(physicalSetsFilter())
    .orderBy(sql`${sets.releaseDate} DESC NULLS LAST`, asc(sets.name));
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
