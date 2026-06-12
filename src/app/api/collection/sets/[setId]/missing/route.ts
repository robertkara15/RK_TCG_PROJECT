import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMissingCardsInSet, getSetById } from "@/lib/catalog/queries";

type RouteContext = {
  params: Promise<{ setId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { setId } = await context.params;
  const set = await getSetById(setId);
  if (!set) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "60");

  const result = await getMissingCardsInSet(session.user.id, setId, {
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 60,
  });

  return NextResponse.json({
    set: {
      id: set.id,
      name: set.name,
      officialCount: set.officialCount,
    },
    ...result,
  });
}
