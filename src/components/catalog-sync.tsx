"use client";

import { useCallback, useEffect, useState } from "react";

type SyncPhase = "sets" | "briefs" | "details" | "derived";

type SyncStatus = {
  status: string;
  error: string | null;
  cardsSyncedCount: number;
  totalCards: number;
  lastFullSyncAt: string | null;
};

type SyncResponse = {
  phase: SyncPhase;
  processed: number;
  total: number;
  complete: boolean;
  nextOffset: number | null;
};

type ActiveJob = "sync" | "recompute" | null;

const PHASES: SyncPhase[] = ["sets", "briefs", "details", "derived"];

const PHASE_LABELS: Record<SyncPhase, string> = {
  sets: "Syncing sets",
  briefs: "Syncing card list",
  details: "Hydrating card details",
  derived: "Computing legality",
};

async function runPhase(
  phase: SyncPhase,
  offset: number,
  batchSize: number,
): Promise<SyncResponse> {
  const response = await fetch("/api/catalog/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phase, offset, batchSize }),
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Sync request failed");
  }

  return response.json() as Promise<SyncResponse>;
}

export function CatalogSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [activeJob, setActiveJob] = useState<ActiveJob>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isBusy = activeJob !== null;

  const refreshStatus = useCallback(async () => {
    const response = await fetch("/api/catalog/sync/status");
    if (response.ok) {
      setStatus((await response.json()) as SyncStatus);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function handleSync() {
    setActiveJob("sync");
    setError(null);

    try {
      for (const phase of PHASES) {
        let offset = 0;
        let complete = false;
        const batchSize = phase === "briefs" ? 500 : 50;

        while (!complete) {
          setProgressLabel(PHASE_LABELS[phase]);
          const result = await runPhase(phase, offset, batchSize);

          if (phase === "sets" || phase === "derived") {
            complete = true;
            setProgressCurrent(result.total);
            setProgressTotal(result.total);
          } else {
            setProgressCurrent(result.nextOffset ?? result.total);
            setProgressTotal(result.total);
            complete = result.complete;
            offset = result.nextOffset ?? offset;
          }
        }
      }

      await refreshStatus();
      setProgressLabel("Sync complete");
    } catch (syncError) {
      const message =
        syncError instanceof Error ? syncError.message : "Catalog sync failed";
      setError(message);
      await refreshStatus();
    } finally {
      setActiveJob(null);
    }
  }

  async function handleRecomputeLegality() {
    const totalCards = status?.totalCards ?? 0;
    setActiveJob("recompute");
    setError(null);
    setProgressLabel("Computing legality");
    setProgressCurrent(0);
    setProgressTotal(totalCards);

    try {
      const response = await fetch("/api/catalog/recompute-legality", {
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Recompute failed");
      }

      const body = (await response.json()) as { total?: number };
      setProgressCurrent(body.total ?? totalCards);
      setProgressTotal(body.total ?? totalCards);
      await refreshStatus();
      setProgressLabel("Legality updated");
    } catch (recomputeError) {
      const message =
        recomputeError instanceof Error ? recomputeError.message : "Recompute failed";
      setError(message);
      await refreshStatus();
    } finally {
      setActiveJob(null);
    }
  }

  const progressPercent =
    progressTotal > 0 ? Math.min(100, Math.round((progressCurrent / progressTotal) * 100)) : 0;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-medium text-white">Catalog sync</h2>
        <p className="text-sm text-zinc-400">
          Pull physical English cards from TCGdex into your database. Pokémon TCG
          Pocket cards are excluded. Legality uses regulation marks H, I, J and
          future marks (G and earlier rotated out). The reprint rule applies to
          Trainers and Energy only — Pokémon are legal per print. No pricing data
          is stored.
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Status</dt>
          <dd className="text-zinc-200">{status?.status ?? "unknown"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Cards in database</dt>
          <dd className="text-zinc-200">{status?.totalCards ?? 0}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Last full sync</dt>
          <dd className="text-zinc-200">
            {status?.lastFullSyncAt
              ? new Date(status.lastFullSyncAt).toLocaleString()
              : "Never"}
          </dd>
        </div>
      </dl>

      {isBusy && progressLabel ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>{progressLabel}</span>
            <span>
              {progressTotal > 0
                ? `${progressCurrent.toLocaleString()} / ${progressTotal.toLocaleString()}`
                : "Working…"}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${progressTotal > 0 ? progressPercent : 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {status?.error ? <p className="text-sm text-red-400">{status.error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={isBusy}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {activeJob === "sync" ? "Syncing catalog…" : "Sync catalog"}
        </button>
        <button
          type="button"
          onClick={() => void handleRecomputeLegality()}
          disabled={isBusy}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {activeJob === "recompute" ? "Recomputing…" : "Recompute legality"}
        </button>
      </div>
    </div>
  );
}
