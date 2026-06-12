import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { pinSetForUser, unpinSetForUser } from "@/lib/catalog/queries";

type RouteContext = {
  params: Promise<{ setId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { setId } = await context.params;
  const row = await pinSetForUser(session.user.id, setId);

  if (!row) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    pinned: true,
    pinnedAt: row.pinnedAt.toISOString(),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { setId } = await context.params;
  await unpinSetForUser(session.user.id, setId);

  return NextResponse.json({ ok: true, pinned: false });
}
