import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCardById } from "@/lib/catalog/queries";
import { addDeckCard, replaceDeckCards, upsertDeckCard } from "@/lib/decks/queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { cards?: { cardName: string; quantity: number }[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.cards)) {
    return NextResponse.json({ error: "cards array is required" }, { status: 400 });
  }

  const deck = await replaceDeckCards(id, session.user.id, body.cards);
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  return NextResponse.json(deck);
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: {
    cardId?: string;
    cardName?: string;
    quantity?: number;
    mode?: "set" | "add";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const quantity = body.quantity ?? 1;

  let cardName = body.cardName?.trim();
  let representativeCardId: string | null = null;

  if (body.cardId) {
    const row = await getCardById(body.cardId);
    if (!row) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    cardName = row.card.name;
    representativeCardId = row.card.id;
  }

  if (!cardName) {
    return NextResponse.json(
      { error: "cardId or cardName is required" },
      { status: 400 },
    );
  }

  const deck =
    body.mode === "set"
      ? await upsertDeckCard(
          id,
          session.user.id,
          cardName,
          quantity,
          representativeCardId,
        )
      : await addDeckCard(
          id,
          session.user.id,
          cardName,
          quantity,
          representativeCardId,
        );
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  return NextResponse.json(deck);
}
