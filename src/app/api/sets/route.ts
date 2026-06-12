import { NextResponse } from "next/server";

import { listSets } from "@/lib/catalog/queries";

export async function GET() {
  const data = await listSets();

  return NextResponse.json({
    data: data.map((set) => ({
      id: set.id,
      name: set.name,
      series: set.series,
      logoUrl: set.logoUrl,
      officialCount: set.officialCount,
      totalCount: set.totalCount,
      releaseDate: set.releaseDate,
    })),
  });
}
