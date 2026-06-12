import { NextResponse } from "next/server";

import { getCatalogFacets } from "@/lib/catalog/facets";
import { listSets } from "@/lib/catalog/queries";

export async function GET() {
  const [facets, sets] = await Promise.all([getCatalogFacets(), listSets()]);

  return NextResponse.json({
    ...facets,
    sets: sets.map((set) => ({
      id: set.id,
      name: set.name,
    })),
  });
}
