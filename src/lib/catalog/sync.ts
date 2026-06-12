import { count, eq, notInArray, sql } from "drizzle-orm";

import { buildTcgdexImageUrl } from "@/lib/catalog/images";
import { mapBriefCard, mapDetailCard } from "@/lib/catalog/map-card";
import { isPocketCard, isPocketSet, POCKET_SET_IDS } from "@/lib/catalog/pocket";
import { purgePocketCatalog } from "@/lib/catalog/purge-pocket";
import { extractSetId } from "@/lib/catalog/normalize";
import { db } from "@/lib/db";
import { cards, formatConfig, sets, syncMetadata } from "@/lib/db/schema";
import {
  fetchAllSets,
  fetchCardBriefsPage,
  fetchCardDetail,
  fetchSetDetail,
} from "@/lib/tcgdex/client";

const DEFAULT_BATCH_SIZE = 50;
const DETAIL_CONCURRENCY = 8;
const POCKET_SET_ID_LIST = [...POCKET_SET_IDS];

function physicalCardsCondition() {
  return notInArray(cards.setId, POCKET_SET_ID_LIST);
}

function pocketSetSqlList() {
  return sql.join(POCKET_SET_ID_LIST.map((id) => sql`${id}`), sql`, `);
}

async function resolveSetSerieId(
  setId: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  if (cache.has(setId)) {
    return cache.get(setId) ?? null;
  }

  const setDetail = await fetchSetDetail(setId);
  const serieId = setDetail?.serie?.id ?? null;
  cache.set(setId, serieId);
  return serieId;
}

async function recomputeDerivedFields() {
  const config = await getFormatConfig();
  const legalMarks = config.legalMarks ?? ["H", "I", "J"];
  const legalMarkSql = sql.join(legalMarks.map((mark) => sql`${mark}`), sql`, `);
  const pocketSets = pocketSetSqlList();

  await db.execute(sql`
    UPDATE cards
    SET legal_standard_print = CASE
      WHEN regulation_mark IS NULL THEN false
      ${config.acceptFutureMarks ? sql`WHEN regulation_mark > 'J' THEN true` : sql``}
      WHEN regulation_mark IN (${legalMarkSql}) THEN true
      ELSE false
    END
    WHERE set_id NOT IN (${pocketSets})
  `);

  await db.execute(sql`
    UPDATE cards AS c
    SET name_is_standard_legal = CASE
      WHEN c.category = 'Pokemon' THEN c.legal_standard_print
      WHEN c.category IN ('Trainer', 'Energy') THEN EXISTS (
        SELECT 1
        FROM cards AS c2
        WHERE c2.normalized_name = c.normalized_name
          AND c2.category = c.category
          AND c2.set_id NOT IN (${pocketSets})
          AND c2.legal_standard_print = true
      )
      ELSE c.legal_standard_print
    END
    WHERE c.set_id NOT IN (${pocketSets})
  `);

  await db.execute(sql`
    UPDATE cards
    SET
      is_basic_energy = (
        category = 'Energy' AND COALESCE(energy_type, '') = 'Basic'
      ),
      is_ace_spec = (
        COALESCE(rarity, '') ILIKE '%ACE SPEC%'
        OR COALESCE(effect, '') ILIKE '%ACE SPEC%'
        OR COALESCE(description, '') ILIKE '%ACE SPEC%'
      )
    WHERE set_id NOT IN (${pocketSets})
  `);

  const [totalRow] = await db
    .select({ value: count() })
    .from(cards)
    .where(physicalCardsCondition());

  await updateSyncMetadata({
    lastSyncStatus: "completed",
    lastFullSyncAt: new Date(),
    lastSyncError: null,
    cardsSyncedCount: totalRow.value,
  });

  return totalRow.value;
}

export type SyncPhase = "sets" | "briefs" | "details" | "derived";

export type SyncRequest = {
  phase: SyncPhase;
  offset?: number;
  batchSize?: number;
};

export type SyncResponse = {
  phase: SyncPhase;
  processed: number;
  total: number;
  complete: boolean;
  nextOffset: number | null;
};

async function getFormatConfig() {
  const [config] = await db.select().from(formatConfig).limit(1);
  if (!config) {
    throw new Error("format_config is not seeded");
  }
  return config;
}

async function updateSyncMetadata(
  patch: Partial<typeof syncMetadata.$inferInsert>,
) {
  await db
    .insert(syncMetadata)
    .values({ id: 1, ...patch })
    .onConflictDoUpdate({
      target: syncMetadata.id,
      set: patch,
    });
}

async function getSyncMetadata() {
  const [metadata] = await db.select().from(syncMetadata).limit(1);
  return metadata ?? null;
}

export async function getSyncStatus() {
  const metadata = await getSyncMetadata();
  const [cardCount] = await db
    .select({ value: count() })
    .from(cards)
    .where(physicalCardsCondition());

  return {
    status: metadata?.lastSyncStatus ?? "idle",
    error: metadata?.lastSyncError ?? null,
    cardsSyncedCount: metadata?.cardsSyncedCount ?? 0,
    totalCards: cardCount.value,
    lastFullSyncAt: metadata?.lastFullSyncAt ?? null,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    const chunk = items.slice(index, index + concurrency);
    const chunkResults = await Promise.all(chunk.map(mapper));
    results.push(...chunkResults);
  }

  return results;
}

export async function runCatalogSync({
  phase,
  offset = 0,
  batchSize = DEFAULT_BATCH_SIZE,
}: SyncRequest): Promise<SyncResponse> {
  await updateSyncMetadata({
    lastSyncStatus: "running",
    lastSyncError: null,
  });

  try {
    if (phase === "sets") {
      await purgePocketCatalog();

      const allSets = (await fetchAllSets()).filter((set) => !isPocketSet(set.id));

      if (allSets.length > 0) {
        await db
          .insert(sets)
          .values(
            allSets.map((set) => ({
              id: set.id,
              name: set.name,
              logoUrl: set.logo ?? null,
              symbolUrl: set.symbol ?? null,
              officialCount: set.cardCount?.official ?? 0,
              totalCount: set.cardCount?.total ?? 0,
              catalogSyncedAt: new Date(),
            })),
          )
          .onConflictDoUpdate({
            target: sets.id,
            set: {
              name: sql`excluded.name`,
              logoUrl: sql`excluded.logo_url`,
              symbolUrl: sql`excluded.symbol_url`,
              officialCount: sql`excluded.official_count`,
              totalCount: sql`excluded.total_count`,
              catalogSyncedAt: sql`excluded.catalog_synced_at`,
            },
          });
      }

      return {
        phase,
        processed: allSets.length,
        total: allSets.length,
        complete: true,
        nextOffset: null,
      };
    }

    if (phase === "briefs") {
      const page = Math.floor(offset / batchSize) + 1;
      const briefs = (await fetchCardBriefsPage(page, batchSize)).filter((brief) => {
        const setId = extractSetId(brief.id, brief.localId);
        return !isPocketCard(brief.id, setId, brief.image);
      });

      if (briefs.length > 0) {
        await db
          .insert(cards)
          .values(briefs.map(mapBriefCard))
          .onConflictDoUpdate({
            target: cards.id,
            set: {
              name: sql`excluded.name`,
              normalizedName: sql`excluded.normalized_name`,
              imageUrl: sql`excluded.image_url`,
              localId: sql`excluded.local_id`,
              setId: sql`excluded.set_id`,
              catalogSyncedAt: sql`excluded.catalog_synced_at`,
            },
          });
      }

      const nextOffset = offset + briefs.length;
      const complete = briefs.length < batchSize;
      const [cardCount] = await db.select({ value: count() }).from(cards);

      await updateSyncMetadata({
        cardsSyncedCount: cardCount.value,
      });

      return {
        phase,
        processed: briefs.length,
        total: complete ? nextOffset : nextOffset + batchSize,
        complete,
        nextOffset: complete ? null : nextOffset,
      };
    }

    if (phase === "details") {
      const cardRows = await db
        .select({ id: cards.id })
        .from(cards)
        .where(physicalCardsCondition())
        .orderBy(cards.id)
        .limit(batchSize)
        .offset(offset);

      const ids = cardRows.map((row) => row.id);
      const setSerieCache = new Map<string, string | null>();
      let processed = 0;

      await mapWithConcurrency(ids, DETAIL_CONCURRENCY, async (cardId) => {
        const detail = await fetchCardDetail(cardId);
        if (!detail) {
          return;
        }

        const setId = detail.set?.id ?? extractSetId(detail.id, detail.localId);
        if (isPocketCard(detail.id, setId, detail.image)) {
          await db.delete(cards).where(eq(cards.id, detail.id));
          return;
        }

        const mapped = mapDetailCard(detail);
        if (!mapped.imageUrl) {
          const serieId = await resolveSetSerieId(mapped.setId, setSerieCache);
          if (serieId) {
            mapped.imageUrl = buildTcgdexImageUrl(
              serieId,
              mapped.setId,
              mapped.localId,
            );
          }
        }
        await db.insert(cards).values(mapped).onConflictDoUpdate({
          target: cards.id,
          set: {
            name: mapped.name,
            normalizedName: mapped.normalizedName,
            category: mapped.category,
            imageUrl: mapped.imageUrl,
            localId: mapped.localId,
            setId: mapped.setId,
            rarity: mapped.rarity,
            illustrator: mapped.illustrator,
            regulationMark: mapped.regulationMark,
            legalStandardPrint: mapped.legalStandardPrint,
            isAceSpec: mapped.isAceSpec,
            isBasicEnergy: mapped.isBasicEnergy,
            hp: mapped.hp,
            types: mapped.types,
            stage: mapped.stage,
            evolveFrom: mapped.evolveFrom,
            dexIds: mapped.dexIds,
            attacks: mapped.attacks,
            abilities: mapped.abilities,
            weaknesses: mapped.weaknesses,
            resistances: mapped.resistances,
            retreat: mapped.retreat,
            description: mapped.description,
            trainerType: mapped.trainerType,
            effect: mapped.effect,
            energyType: mapped.energyType,
            variants: mapped.variants,
            tcgdexUpdatedAt: mapped.tcgdexUpdatedAt,
            catalogSyncedAt: mapped.catalogSyncedAt,
          },
        });
        processed += 1;
      });

      const [totalRow] = await db
        .select({ value: count() })
        .from(cards)
        .where(physicalCardsCondition());
      const total = totalRow.value;
      const nextOffset = offset + ids.length;
      const complete = nextOffset >= total;

      await updateSyncMetadata({
        cardsSyncedCount: nextOffset,
      });

      return {
        phase,
        processed,
        total,
        complete,
        nextOffset: complete ? null : nextOffset,
      };
    }

    if (phase === "derived") {
      const total = await recomputeDerivedFields();

      return {
        phase,
        processed: total,
        total,
        complete: true,
        nextOffset: null,
      };
    }

    throw new Error(`Unknown sync phase: ${phase}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await updateSyncMetadata({
      lastSyncStatus: "failed",
      lastSyncError: message,
    });
    throw error;
  }
}
