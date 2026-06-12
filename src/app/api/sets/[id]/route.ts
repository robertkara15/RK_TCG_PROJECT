import { NextResponse } from "next/server";

import { getSetById } from "@/lib/catalog/queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const set = await getSetById(id);

  if (!set) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  return NextResponse.json({ data: set });
}
