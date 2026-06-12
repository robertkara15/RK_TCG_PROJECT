import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { upsertCollectionEntry } from "@/lib/catalog/queries";

type RouteContext = {
  params: Promise<{ cardId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await context.params;
  await upsertCollectionEntry(session.user.id, cardId, 0);

  return NextResponse.json({ ok: true });
}
