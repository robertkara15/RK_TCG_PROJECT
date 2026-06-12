import { eq, isNull } from "drizzle-orm";

import { isPocketSet } from "@/lib/catalog/pocket";
import { db } from "@/lib/db";
import { sets } from "@/lib/db/schema";
import { fetchSetDetail } from "@/lib/tcgdex/client";

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<void>,
) {
  for (let index = 0; index < items.length; index += concurrency) {
    const chunk = items.slice(index, index + concurrency);
    await Promise.all(chunk.map(mapper));
  }
}

export async function enrichSetFromTcgdex(setId: string) {
  const detail = await fetchSetDetail(setId);
  if (!detail) {
    return null;
  }

  await db
    .update(sets)
    .set({
      releaseDate: detail.releaseDate ?? null,
      series: detail.serie?.id ?? null,
    })
    .where(eq(sets.id, setId));

  return detail;
}

export async function enrichSetsMissingMetadata(concurrency = 8) {
  const rows = await db
    .select({ id: sets.id })
    .from(sets)
    .where(isNull(sets.releaseDate));

  const setIds = rows.map((row) => row.id).filter((id) => !isPocketSet(id));
  if (setIds.length === 0) {
    return 0;
  }

  await mapWithConcurrency(setIds, concurrency, async (setId) => {
    await enrichSetFromTcgdex(setId);
  });
  return setIds.length;
}
