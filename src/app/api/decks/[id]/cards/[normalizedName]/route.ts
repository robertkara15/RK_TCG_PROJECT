import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { removeDeckCard } from "@/lib/decks/queries";

type RouteContext = {
  params: Promise<{ id: string; normalizedName: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, normalizedName } = await context.params;
  const decodedName = decodeURIComponent(normalizedName);
  const deck = await removeDeckCard(id, session.user.id, decodedName);

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  return NextResponse.json(deck);
}
