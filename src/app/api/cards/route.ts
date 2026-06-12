import { NextResponse } from "next/server";

import {
  parseCardFiltersFromSearchParams,
  parseSortOption,
} from "@/lib/catalog/filter-sort";
import { searchCards } from "@/lib/catalog/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "40");

  const result = await searchCards({
    ...parseCardFiltersFromSearchParams(searchParams),
    sort: parseSortOption(searchParams.get("sort")),
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 40,
  });

  return NextResponse.json({
    data: result.data.map((card) => ({
      id: card.id,
      name: card.name,
      imageUrl: card.imageUrl,
      set: card.set,
      localId: card.localId,
      regulationMark: card.regulationMark,
      legalStandardPrint: card.legalStandardPrint,
      nameIsStandardLegal: card.nameIsStandardLegal,
      category: card.category,
      rarity: card.rarity,
    })),
    pagination: result.pagination,
  });
}
