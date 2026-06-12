import { and, eq, inArray, or, sql } from "drizzle-orm";

import { normalizeCardName } from "@/lib/catalog/normalize";
import { POCKET_SET_IDS } from "@/lib/catalog/pocket";
import type { ParsedPtcglLine } from "@/lib/decks/ptcgl-parser";
import { resolvePtcglSetId } from "@/lib/decks/ptcgl-set-codes";
import { db } from "@/lib/db";
import { cards } from "@/lib/db/schema";

const POCKET_SET_ID_LIST = [...POCKET_SET_IDS];

export type ResolvedImportLine = {
  cardName: string;
  normalizedName: string;
  quantity: number;
  representativeCardId: string | null;
};

export type ImportResolutionResult = {
  resolved: ResolvedImportLine[];
  unresolved: string[];
};

function physicalCardsFilter() {
  return and(
    sql`${cards.setId} NOT IN (${sql.join(
      POCKET_SET_ID_LIST.map((id) => sql`${id}`),
      sql`, `,
    )})`,
    sql`(${cards.imageUrl} IS NULL OR ${cards.imageUrl} NOT LIKE '%/tcgp/%')`,
  );
}

function localIdVariants(cardNumber: string): string[] {
  const trimmed = cardNumber.trim();
  const variants = new Set<string>([trimmed]);
  if (/^\d+$/.test(trimmed)) {
    const numeric = String(parseInt(trimmed, 10));
    variants.add(numeric);
    variants.add(numeric.padStart(3, "0"));
  }
  return [...variants];
}

async function findCardBySetAndNumber(
  setId: string,
  cardNumber: string,
  expectedName?: string,
) {
  const variants = localIdVariants(cardNumber);
  const rows = await db
    .select({
      id: cards.id,
      name: cards.name,
      normalizedName: cards.normalizedName,
      nameIsStandardLegal: cards.nameIsStandardLegal,
    })
    .from(cards)
    .where(
      and(
        eq(cards.setId, setId),
        inArray(cards.localId, variants),
        physicalCardsFilter(),
      ),
    );

  if (rows.length === 0) {
    return null;
  }

  if (expectedName) {
    const expectedNormalized = normalizeCardName(expectedName);
    const exact = rows.find(
      (row) => row.normalizedName === expectedNormalized,
    );
    if (exact) {
      return exact;
    }
    // PTCGL card numbers often differ from TCGdex — do not pick a different card.
    return null;
  }

  return rows[0] ?? null;
}

async function findCardByName(cardName: string) {
  const normalizedName = normalizeCardName(cardName);
  const rows = await db
    .select({
      id: cards.id,
      name: cards.name,
      normalizedName: cards.normalizedName,
      nameIsStandardLegal: cards.nameIsStandardLegal,
      localId: cards.localId,
    })
    .from(cards)
    .where(
      and(
        or(
          eq(cards.normalizedName, normalizedName),
          sql`${cards.name} ILIKE ${cardName.trim()}`,
        ),
        physicalCardsFilter(),
      ),
    );

  if (rows.length === 0) {
    return null;
  }

  return (
    [...rows].sort((a, b) => {
      if (a.nameIsStandardLegal !== b.nameIsStandardLegal) {
        return a.nameIsStandardLegal ? -1 : 1;
      }
      return a.localId.localeCompare(b.localId, undefined, { numeric: true });
    })[0] ?? null
  );
}

async function findCardByNameInSet(setId: string, cardName: string) {
  const normalizedName = normalizeCardName(cardName);
  const rows = await db
    .select({
      id: cards.id,
      name: cards.name,
      normalizedName: cards.normalizedName,
      nameIsStandardLegal: cards.nameIsStandardLegal,
      localId: cards.localId,
    })
    .from(cards)
    .where(
      and(
        eq(cards.setId, setId),
        eq(cards.normalizedName, normalizedName),
        physicalCardsFilter(),
      ),
    );

  if (rows.length === 0) {
    return null;
  }

  return (
    [...rows].sort((a, b) => {
      if (a.nameIsStandardLegal !== b.nameIsStandardLegal) {
        return a.nameIsStandardLegal ? -1 : 1;
      }
      return a.localId.localeCompare(b.localId, undefined, { numeric: true });
    })[0] ?? null
  );
}

async function resolveLine(line: ParsedPtcglLine) {
  if (line.setCode && line.cardNumber) {
    const setId = resolvePtcglSetId(line.setCode);
    if (setId) {
      const byPrint = await findCardBySetAndNumber(
        setId,
        line.cardNumber,
        line.cardName,
      );
      if (byPrint) {
        return byPrint;
      }

      const byNameInSet = await findCardByNameInSet(setId, line.cardName);
      if (byNameInSet) {
        return byNameInSet;
      }
    }
  }

  return findCardByName(line.cardName);
}

export async function resolvePtcglImportLines(
  lines: ParsedPtcglLine[],
): Promise<ImportResolutionResult> {
  const merged = new Map<
    string,
    {
      cardName: string;
      normalizedName: string;
      quantity: number;
      representativeCardId: string | null;
    }
  >();
  const unresolved: string[] = [];

  for (const line of lines) {
    const card = await resolveLine(line);
    if (!card) {
      unresolved.push(line.rawLine);
      continue;
    }

    const existing = merged.get(card.normalizedName);
    merged.set(card.normalizedName, {
      cardName: card.name,
      normalizedName: card.normalizedName,
      quantity: (existing?.quantity ?? 0) + line.quantity,
      representativeCardId:
        existing?.representativeCardId ?? card.id ?? null,
    });
  }

  return {
    resolved: [...merged.values()],
    unresolved,
  };
}
