import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getSetById,
  getSetCardsWithOwnership,
  getSetCompletionForUser,
} from "@/lib/catalog/queries";

type RouteContext = {
  params: Promise<{ setId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { setId } = await context.params;
  const [set, completion] = await Promise.all([
    getSetById(setId),
    getSetCompletionForUser(session.user.id, setId),
  ]);

  if (!set || !completion) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "60");

  const result = await getSetCardsWithOwnership(session.user.id, setId, {
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 60,
  });

  return NextResponse.json({
    set: completion.set,
    ownedCount: completion.ownedCount,
    completionPercent: completion.completionPercent,
    ...result,
  });
}
