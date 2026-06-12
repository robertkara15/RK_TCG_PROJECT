import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createDeck, listDecks } from "@/lib/decks/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folder");
  const tagId = searchParams.get("tag") ?? undefined;

  const data = await listDecks(session.user.id, {
    folderId: folderId && folderId !== "all" ? folderId : undefined,
    tagId,
  });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; folderId?: string | null; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const deck = await createDeck(session.user.id, {
    name: body.name,
    folderId: body.folderId,
    notes: body.notes,
  });

  return NextResponse.json({ data: deck }, { status: 201 });
}
