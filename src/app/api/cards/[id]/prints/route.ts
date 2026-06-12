import { NextResponse } from "next/server";

import { getCardById, getOtherPrints } from "@/lib/catalog/queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const row = await getCardById(id);

  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const prints = await getOtherPrints(row.card.id, row.card.normalizedName);

  return NextResponse.json({
    data: prints.map((print) => ({
      id: print.id,
      name: print.name,
      imageUrl: print.imageUrl,
      localId: print.localId,
      set: { id: print.setId, name: print.setName },
      nameIsStandardLegal: print.nameIsStandardLegal,
    })),
  });
}
