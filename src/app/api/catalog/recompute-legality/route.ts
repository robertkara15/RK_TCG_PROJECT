import { NextResponse } from "next/server";

import { runCatalogSync } from "@/lib/catalog/sync";

export const maxDuration = 60;

export async function POST() {
  try {
    const result = await runCatalogSync({ phase: "derived" });

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      total: result.total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recompute failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
