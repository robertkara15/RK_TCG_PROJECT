import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getCollectionSetCompletion } from "@/lib/catalog/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getCollectionSetCompletion(session.user.id);
  return NextResponse.json({ data });
}
