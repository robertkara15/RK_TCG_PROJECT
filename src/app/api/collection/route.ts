import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  parseCardFiltersFromSearchParams,
  parseSortOption,
} from "@/lib/catalog/filter-sort";
import { searchCollection, upsertCollectionEntry } from "@/lib/catalog/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "40");

  const result = await searchCollection(session.user.id, {
    ...parseCardFiltersFromSearchParams(searchParams),
    sort: parseSortOption(searchParams.get("sort") ?? "added_new"),
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 40,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { cardId?: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.cardId || body.quantity == null) {
    return NextResponse.json(
      { error: "cardId and quantity are required" },
      { status: 400 },
    );
  }

  const row = await upsertCollectionEntry(
    session.user.id,
    body.cardId,
    body.quantity,
  );

  return NextResponse.json({ data: row });
}
