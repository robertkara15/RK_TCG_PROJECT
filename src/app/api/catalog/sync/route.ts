import { NextResponse } from "next/server";

import { runCatalogSync, type SyncPhase } from "@/lib/catalog/sync";

export const maxDuration = 60;

const VALID_PHASES = new Set<SyncPhase>(["sets", "briefs", "details", "derived"]);

export async function POST(request: Request) {
  let body: {
    phase?: SyncPhase;
    offset?: number;
    batchSize?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.phase || !VALID_PHASES.has(body.phase)) {
    return NextResponse.json({ error: "Invalid sync phase" }, { status: 400 });
  }

  try {
    const result = await runCatalogSync({
      phase: body.phase,
      offset: body.offset ?? 0,
      batchSize: body.batchSize ?? 50,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
