import { and, asc, isNotNull, sql } from "drizzle-orm";

import { POCKET_SET_IDS } from "@/lib/catalog/pocket";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";

const POCKET_SET_ID_LIST = [...POCKET_SET_IDS];

function physicalCardsFilter() {
  return sql`${cards.setId} NOT IN (${sql.join(
    POCKET_SET_ID_LIST.map((id) => sql`${id}`),
    sql`, `,
  )})`;
}

export async function getCatalogFacets() {
  const baseWhere = physicalCardsFilter();

  const [rarities, stages, energyTypes, illustrators, regulationMarks] =
    await Promise.all([
      db
        .selectDistinct({ value: cards.rarity })
        .from(cards)
        .where(and(baseWhere, isNotNull(cards.rarity)))
        .orderBy(asc(cards.rarity)),
      db
        .selectDistinct({ value: cards.stage })
        .from(cards)
        .where(and(baseWhere, isNotNull(cards.stage)))
        .orderBy(asc(cards.stage)),
      db
        .selectDistinct({ value: cards.energyType })
        .from(cards)
        .where(and(baseWhere, isNotNull(cards.energyType)))
        .orderBy(asc(cards.energyType)),
      db
        .selectDistinct({ value: cards.illustrator })
        .from(cards)
        .where(and(baseWhere, isNotNull(cards.illustrator)))
        .orderBy(asc(cards.illustrator))
        .limit(200),
      db
        .selectDistinct({ value: cards.regulationMark })
        .from(cards)
        .where(and(baseWhere, isNotNull(cards.regulationMark)))
        .orderBy(asc(cards.regulationMark)),
    ]);

  return {
    rarities: rarities.map((row) => row.value).filter(Boolean) as string[],
    stages: stages.map((row) => row.value).filter(Boolean) as string[],
    energyTypes: energyTypes.map((row) => row.value).filter(Boolean) as string[],
    illustrators: illustrators.map((row) => row.value).filter(Boolean) as string[],
    regulationMarks: regulationMarks
      .map((row) => row.value)
      .filter(Boolean) as string[],
  };
}
