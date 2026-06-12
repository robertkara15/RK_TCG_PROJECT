import { NextResponse } from "next/server";

import { searchCards } from "@/lib/catalog/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q") ?? undefined;
  const set = searchParams.get("set") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const standardLegalParam = searchParams.get("standardLegal");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "40");

  const standardLegal =
    standardLegalParam === null
      ? undefined
      : standardLegalParam === "true" || standardLegalParam === "1";

  const result = await searchCards({
    q,
    set,
    category,
    standardLegal,
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
    })),
    pagination: result.pagination,
  });
}
