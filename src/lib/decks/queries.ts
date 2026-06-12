import { and, asc, eq, inArray, or, sql } from "drizzle-orm";

import { normalizeCardName } from "@/lib/catalog/normalize";
import { POCKET_SET_IDS } from "@/lib/catalog/pocket";
import { parsePtcglDeckText } from "@/lib/decks/ptcgl-parser";
import { resolvePtcglImportLines } from "@/lib/decks/resolve-ptcgl-import";
import {
  collectEnergyFallbackCatalogNames,
  resolveCardDisplayImage,
} from "@/lib/decks/resolve-card-image";
import {
  buildCatalogMap,
  pickRepresentativeCard,
  validateDeck,
} from "@/lib/decks/validate";
import type { CatalogCardMeta, DeckCardEntry } from "@/lib/decks/types";
import { db } from "@/lib/db";
import {
  cards,
  deckCards,
  decks,
  deckTags,
  folders,
  sets,
  tags,
} from "@/lib/db/schema";

const POCKET_SET_ID_LIST = [...POCKET_SET_IDS];

async function assertDeckOwner(deckId: string, userId: string) {
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  return deck ?? null;
}

export async function listFolders(userId: string) {
  return db
    .select()
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(asc(folders.sortOrder), asc(folders.name));
}

export async function createFolder(userId: string, name: string) {
  const [row] = await db
    .insert(folders)
    .values({ userId, name: name.trim() })
    .returning();
  return row;
}

export async function updateFolder(
  userId: string,
  folderId: string,
  patch: { name?: string; sortOrder?: number },
) {
  const [row] = await db
    .update(folders)
    .set(patch)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteFolder(userId: string, folderId: string) {
  await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
}

export async function listTags(userId: string) {
  return db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(asc(tags.name));
}

export async function createTag(
  userId: string,
  name: string,
  color?: string | null,
) {
  const normalized = name.trim().toLowerCase();
  const [row] = await db
    .insert(tags)
    .values({ userId, name: normalized, color: color ?? null })
    .onConflictDoUpdate({
      target: [tags.userId, tags.name],
      set: { color: color ?? null },
    })
    .returning();
  return row;
}

export async function updateTag(
  userId: string,
  tagId: string,
  patch: { name?: string; color?: string | null },
) {
  const values = {
    ...patch,
    ...(patch.name ? { name: patch.name.trim().toLowerCase() } : {}),
  };
  const [row] = await db
    .update(tags)
    .set(values)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteTag(userId: string, tagId: string) {
  await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.userId, userId)));
}

async function loadCatalogMetaForNames(
  normalizedNames: string[],
  cardIds: string[] = [],
): Promise<CatalogCardMeta[]> {
  if (normalizedNames.length === 0 && cardIds.length === 0) {
    return [];
  }

  const lookupFilters = [];
  if (normalizedNames.length > 0) {
    lookupFilters.push(inArray(cards.normalizedName, normalizedNames));
  }
  if (cardIds.length > 0) {
    lookupFilters.push(inArray(cards.id, cardIds));
  }

  const lookupFilter =
    lookupFilters.length === 1 ? lookupFilters[0] : or(...lookupFilters);

  return db
    .select({
      id: cards.id,
      name: cards.name,
      normalizedName: cards.normalizedName,
      category: cards.category,
      stage: cards.stage,
      trainerType: cards.trainerType,
      energyType: cards.energyType,
      nameIsStandardLegal: cards.nameIsStandardLegal,
      isAceSpec: cards.isAceSpec,
      isBasicEnergy: cards.isBasicEnergy,
      imageUrl: cards.imageUrl,
      localId: cards.localId,
      setReleaseDate: sets.releaseDate,
    })
    .from(cards)
    .innerJoin(sets, eq(cards.setId, sets.id))
    .where(
      and(
        lookupFilter,
        sql`${cards.setId} NOT IN (${sql.join(
          POCKET_SET_ID_LIST.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      ),
    );
}

async function getDeckTagRows(deckId: string) {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(deckTags)
    .innerJoin(tags, eq(deckTags.tagId, tags.id))
    .where(eq(deckTags.deckId, deckId));
}

function resolveRepresentativeCard(
  entry: DeckCardEntry,
  catalogByName: Map<string, CatalogCardMeta[]>,
  catalogById: Map<string, CatalogCardMeta>,
) {
  if (entry.representativeCardId) {
    const stored = catalogById.get(entry.representativeCardId);
    if (stored) {
      return stored;
    }
  }

  return pickRepresentativeCard(catalogByName, entry.normalizedName);
}

async function loadCatalogForDeck(entries: DeckCardEntry[]) {
  const representativeIds = entries
    .map((row) => row.representativeCardId)
    .filter((id): id is string => Boolean(id));

  let catalog = await loadCatalogMetaForNames(
    entries.map((row) => row.normalizedName),
    representativeIds,
  );

  const catalogByName = buildCatalogMap(catalog);
  const fallbackNames = collectEnergyFallbackCatalogNames(entries, catalogByName);

  if (fallbackNames.length > 0) {
    const extraCatalog = await loadCatalogMetaForNames(fallbackNames);
    const seen = new Set(catalog.map((card) => card.id));
    catalog = [
      ...catalog,
      ...extraCatalog.filter((card) => !seen.has(card.id)),
    ];
  }

  return catalog;
}

function buildDeckResponse(
  deck: typeof decks.$inferSelect,
  tagRows: { id: string; name: string; color: string | null }[],
  entries: DeckCardEntry[],
  catalog: CatalogCardMeta[],
) {
  const catalogByName = buildCatalogMap(catalog);
  const catalogById = new Map(catalog.map((card) => [card.id, card]));
  const validation = validateDeck(entries, catalogByName);

  return {
    deck: {
      id: deck.id,
      name: deck.name,
      folderId: deck.folderId,
      notes: deck.notes,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      tags: tagRows,
    },
    cards: entries.map((entry) => {
      const representative = resolveRepresentativeCard(
        entry,
        catalogByName,
        catalogById,
      );
      return {
        cardName: entry.cardName,
        normalizedName: entry.normalizedName,
        quantity: entry.quantity,
        category: representative?.category ?? "Unknown",
        trainerType: representative?.trainerType ?? null,
        representativeCard: representative
          ? {
              id: representative.id,
              name: representative.name,
              imageUrl: resolveCardDisplayImage(representative, catalogByName),
            }
          : null,
        nameIsStandardLegal: representative
          ? catalogByName.get(entry.normalizedName)?.some((c) => c.nameIsStandardLegal) ?? false
          : false,
        isAceSpec: representative
          ? catalogByName.get(entry.normalizedName)?.some((c) => c.isAceSpec) ?? false
          : false,
      };
    }),
    stats: validation.stats,
    validation: {
      isValid: validation.isValid,
      warnings: validation.warnings,
    },
  };
}

export async function listDecks(
  userId: string,
  filters?: { folderId?: string | null; tagId?: string },
) {
  const conditions = [eq(decks.userId, userId)];

  if (filters?.folderId) {
    conditions.push(eq(decks.folderId, filters.folderId));
  }

  const deckRows = await db
    .select()
    .from(decks)
    .where(and(...conditions))
    .orderBy(asc(decks.name));

  let filteredDeckRows = deckRows;
  if (filters?.tagId) {
    const tagged = await db
      .select({ deckId: deckTags.deckId })
      .from(deckTags)
      .where(eq(deckTags.tagId, filters.tagId));
    const allowed = new Set(tagged.map((row) => row.deckId));
    filteredDeckRows = deckRows.filter((deck) => allowed.has(deck.id));
  }

  const summaries = await Promise.all(
    filteredDeckRows.map(async (deck) => {
      const entryRows = await db
        .select({
          cardName: deckCards.cardName,
          normalizedName: deckCards.normalizedName,
          quantity: deckCards.quantity,
        })
        .from(deckCards)
        .where(eq(deckCards.deckId, deck.id));

      const normalizedNames = entryRows.map((row) => row.normalizedName);
      const catalog = await loadCatalogMetaForNames(normalizedNames);
      const validation = validateDeck(entryRows, buildCatalogMap(catalog));
      const tagRows = await getDeckTagRows(deck.id);

      return {
        id: deck.id,
        name: deck.name,
        folderId: deck.folderId,
        notes: deck.notes,
        updatedAt: deck.updatedAt,
        totalCards: validation.stats.totalCards,
        warningCount: validation.warnings.length,
        isValid: validation.isValid,
        tags: tagRows,
      };
    }),
  );

  return summaries;
}

export async function createDeck(
  userId: string,
  input: { name: string; folderId?: string | null; notes?: string },
) {
  const [deck] = await db
    .insert(decks)
    .values({
      userId,
      name: input.name.trim(),
      folderId: input.folderId ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  return deck;
}

export async function getDeckDetail(deckId: string, userId: string) {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);

  if (!deck) {
    return null;
  }

  const entryRows = await db
    .select({
      cardName: deckCards.cardName,
      normalizedName: deckCards.normalizedName,
      quantity: deckCards.quantity,
      representativeCardId: deckCards.representativeCardId,
    })
    .from(deckCards)
    .where(eq(deckCards.deckId, deckId))
    .orderBy(asc(deckCards.cardName));

  const catalog = await loadCatalogForDeck(entryRows);
  const tagRows = await getDeckTagRows(deckId);

  return buildDeckResponse(deck, tagRows, entryRows, catalog);
}

export async function updateDeck(
  deckId: string,
  userId: string,
  patch: {
    name?: string;
    folderId?: string | null;
    notes?: string | null;
    tagIds?: string[];
  },
) {
  const owned = await assertDeckOwner(deckId, userId);
  if (!owned) {
    return null;
  }

  const { tagIds, ...deckPatch } = patch;
  const [deck] = await db
    .update(decks)
    .set({
      ...deckPatch,
      ...(deckPatch.name ? { name: deckPatch.name.trim() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(decks.id, deckId))
    .returning();

  if (tagIds) {
    await db.delete(deckTags).where(eq(deckTags.deckId, deckId));
    if (tagIds.length > 0) {
      await db.insert(deckTags).values(
        tagIds.map((tagId) => ({
          deckId,
          tagId,
        })),
      );
    }
  }

  return getDeckDetail(deckId, userId);
}

export async function deleteDeck(deckId: string, userId: string) {
  const owned = await assertDeckOwner(deckId, userId);
  if (!owned) {
    return false;
  }

  await db.delete(decks).where(eq(decks.id, deckId));
  return true;
}

export async function replaceDeckCards(
  deckId: string,
  userId: string,
  cardsInput: {
    cardName: string;
    quantity: number;
    representativeCardId?: string | null;
  }[],
) {
  const owned = await assertDeckOwner(deckId, userId);
  if (!owned) {
    return null;
  }

  await db.delete(deckCards).where(eq(deckCards.deckId, deckId));

  if (cardsInput.length > 0) {
    const merged = new Map<
      string,
      {
        cardName: string;
        quantity: number;
        representativeCardId: string | null;
      }
    >();
    for (const card of cardsInput) {
      const normalizedName = normalizeCardName(card.cardName);
      const existing = merged.get(normalizedName);
      merged.set(normalizedName, {
        cardName: card.cardName.trim(),
        quantity: (existing?.quantity ?? 0) + card.quantity,
        representativeCardId:
          existing?.representativeCardId ?? card.representativeCardId ?? null,
      });
    }

    await db.insert(deckCards).values(
      [...merged.entries()].map(([normalizedName, card]) => ({
        deckId,
        cardName: card.cardName,
        normalizedName,
        quantity: card.quantity,
        representativeCardId: card.representativeCardId,
      })),
    );
  }

  await db
    .update(decks)
    .set({ updatedAt: new Date() })
    .where(eq(decks.id, deckId));

  return getDeckDetail(deckId, userId);
}

export async function importPtcglDeck(
  deckId: string,
  userId: string,
  text: string,
) {
  const owned = await assertDeckOwner(deckId, userId);
  if (!owned) {
    return null;
  }

  const parsed = parsePtcglDeckText(text);
  if (parsed.length === 0) {
    return {
      imported: 0,
      unresolved: [] as string[],
      deck: await getDeckDetail(deckId, userId),
    };
  }

  const { resolved, unresolved } = await resolvePtcglImportLines(parsed);

  const deck = await replaceDeckCards(
    deckId,
    userId,
    resolved.map((entry) => ({
      cardName: entry.cardName,
      quantity: entry.quantity,
      representativeCardId: entry.representativeCardId,
    })),
  );

  if (!deck) {
    return null;
  }

  const importedCards = resolved.reduce(
    (total, entry) => total + entry.quantity,
    0,
  );

  return {
    imported: importedCards,
    unresolved,
    deck,
  };
}

export async function addDeckCard(
  deckId: string,
  userId: string,
  cardName: string,
  addQuantity = 1,
  representativeCardId?: string | null,
) {
  const owned = await assertDeckOwner(deckId, userId);
  if (!owned) {
    return null;
  }

  const normalizedName = normalizeCardName(cardName);
  const [existing] = await db
    .select({ quantity: deckCards.quantity })
    .from(deckCards)
    .where(
      and(
        eq(deckCards.deckId, deckId),
        eq(deckCards.normalizedName, normalizedName),
      ),
    )
    .limit(1);

  const nextQuantity = (existing?.quantity ?? 0) + addQuantity;
  return upsertDeckCard(
    deckId,
    userId,
    cardName,
    nextQuantity,
    representativeCardId,
  );
}

export async function upsertDeckCard(
  deckId: string,
  userId: string,
  cardName: string,
  quantity: number,
  representativeCardId?: string | null,
) {
  const owned = await assertDeckOwner(deckId, userId);
  if (!owned) {
    return null;
  }

  const normalizedName = normalizeCardName(cardName);

  if (quantity <= 0) {
    await db
      .delete(deckCards)
      .where(
        and(
          eq(deckCards.deckId, deckId),
          eq(deckCards.normalizedName, normalizedName),
        ),
      );
  } else {
    const updateSet: {
      cardName: string;
      quantity: number;
      representativeCardId?: string | null;
    } = {
      cardName: cardName.trim(),
      quantity,
    };

    if (representativeCardId) {
      updateSet.representativeCardId = representativeCardId;
    }

    await db
      .insert(deckCards)
      .values({
        deckId,
        cardName: cardName.trim(),
        normalizedName,
        quantity,
        representativeCardId: representativeCardId ?? null,
      })
      .onConflictDoUpdate({
        target: [deckCards.deckId, deckCards.normalizedName],
        set: updateSet,
      });
  }

  await db
    .update(decks)
    .set({ updatedAt: new Date() })
    .where(eq(decks.id, deckId));

  return getDeckDetail(deckId, userId);
}

export async function removeDeckCard(
  deckId: string,
  userId: string,
  normalizedName: string,
) {
  const owned = await assertDeckOwner(deckId, userId);
  if (!owned) {
    return null;
  }

  await db
    .delete(deckCards)
    .where(
      and(
        eq(deckCards.deckId, deckId),
        eq(deckCards.normalizedName, normalizedName),
      ),
    );

  await db
    .update(decks)
    .set({ updatedAt: new Date() })
    .where(eq(decks.id, deckId));

  return getDeckDetail(deckId, userId);
}
