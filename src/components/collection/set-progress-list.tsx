"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type SetCompletion = {
  set: {
    id: string;
    name: string;
    officialCount: number;
    releaseDate: string | null;
  };
  ownedCount: number;
  completionPercent: number;
  pinned: boolean;
  pinnedAt: string | null;
};

type SortMode = "progress" | "name" | "release";

function sortSets(rows: SetCompletion[], sort: SortMode) {
  return [...rows].sort((a, b) => {
    switch (sort) {
      case "progress":
        return (
          b.completionPercent - a.completionPercent ||
          a.set.name.localeCompare(b.set.name)
        );
      case "name":
        return a.set.name.localeCompare(b.set.name);
      case "release":
      default:
        return (
          (b.set.releaseDate ?? "").localeCompare(a.set.releaseDate ?? "") ||
          a.set.name.localeCompare(b.set.name)
        );
    }
  });
}

function SetProgressRow({
  item,
  onPinChange,
}: {
  item: SetCompletion;
  onPinChange: (setId: string, pinned: boolean, pinnedAt: string | null) => void;
}) {
  const [isPinning, setIsPinning] = useState(false);

  async function togglePin() {
    setIsPinning(true);
    try {
      const response = await fetch(`/api/collection/sets/${item.set.id}/pin`, {
        method: item.pinned ? "DELETE" : "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to update pin");
      }

      const body = (await response.json()) as {
        pinned: boolean;
        pinnedAt?: string;
      };
      onPinChange(item.set.id, body.pinned, body.pinnedAt ?? null);
    } finally {
      setIsPinning(false);
    }
  }

  return (
    <li
      className={`list-none rounded-xl border p-4 ${
        item.pinned
          ? "border-amber-500/50 bg-amber-950/20"
          : "border-zinc-800 bg-zinc-900/40"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            onClick={() => void togglePin()}
            disabled={isPinning}
            title={item.pinned ? "Unpin set" : "Pin set"}
            aria-label={item.pinned ? "Unpin set" : "Pin set"}
            className={`mt-0.5 shrink-0 rounded-lg border px-2 py-1.5 text-sm transition disabled:opacity-50 ${
              item.pinned
                ? "border-amber-500/60 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            }`}
          >
            {item.pinned ? "★" : "☆"}
          </button>
          <div className="min-w-0 space-y-1">
            <h2 className="font-medium text-white">
              {item.set.name}{" "}
              <span className="text-sm font-normal text-zinc-500">
                ({item.set.id})
              </span>
              {item.pinned ? (
                <span className="ml-2 text-xs font-medium uppercase tracking-wide text-amber-400">
                  Pinned
                </span>
              ) : null}
            </h2>
            <p className="text-sm text-zinc-400">
              {item.ownedCount.toLocaleString()} /{" "}
              {item.set.officialCount.toLocaleString()} cards ·{" "}
              {item.completionPercent.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/collection/sets/${item.set.id}`}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            View set
          </Link>
          <Link
            href={`/collection/sets/${item.set.id}?view=missing`}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Missing
          </Link>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${
            item.pinned ? "bg-amber-500" : "bg-violet-600"
          }`}
          style={{ width: `${Math.min(100, item.completionPercent)}%` }}
        />
      </div>
    </li>
  );
}

export function SetProgressList() {
  const [items, setItems] = useState<SetCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("release");
  const [hideComplete, setHideComplete] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const loadSets = useCallback(async () => {
    const response = await fetch("/api/collection/sets");
    const body = await response.json();
    setItems((body.data ?? []) as SetCompletion[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadSets();
  }, [loadSets]);

  const handlePinChange = useCallback(
    (setId: string, pinned: boolean, pinnedAt: string | null) => {
      setItems((current) =>
        current.map((item) =>
          item.set.id === setId ? { ...item, pinned, pinnedAt } : item,
        ),
      );
    },
    [],
  );

  const { pinnedRows, unpinnedRows } = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const rows = items.filter((item) => {
      if (pinnedOnly && !item.pinned) {
        return false;
      }
      if (hideComplete && item.completionPercent >= 100) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return (
        item.set.name.toLowerCase().includes(normalizedQuery) ||
        item.set.id.toLowerCase().includes(normalizedQuery)
      );
    });

    const pinned = sortSets(
      rows.filter((item) => item.pinned),
      sort,
    ).sort(
      (a, b) =>
        (a.pinnedAt ?? "").localeCompare(b.pinnedAt ?? "") ||
        a.set.name.localeCompare(b.set.name),
    );
    const unpinned = sortSets(
      rows.filter((item) => !item.pinned),
      sort,
    );

    return { pinnedRows: pinned, unpinnedRows: unpinned };
  }, [hideComplete, items, pinnedOnly, query, sort]);

  const pinnedCount = items.filter((item) => item.pinned).length;

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading set progress…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sets…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 outline-none ring-violet-500 focus:ring-2"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortMode)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100"
        >
          <option value="release">Newest sets</option>
          <option value="progress">Highest completion</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hideComplete}
            onChange={(event) => setHideComplete(event.target.checked)}
            className="rounded border-zinc-600 bg-zinc-900"
          />
          Hide 100% complete sets
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pinnedOnly}
            onChange={(event) => setPinnedOnly(event.target.checked)}
            className="rounded border-zinc-600 bg-zinc-900"
          />
          Pinned only{pinnedCount > 0 ? ` (${pinnedCount})` : ""}
        </label>
      </div>

      {pinnedRows.length === 0 && unpinnedRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-400">
          {pinnedOnly
            ? "No pinned sets yet. Click the star on any set to pin it."
            : "No sets match your filters."}
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedRows.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                Pinned
              </h2>
              <ul className="space-y-3">
                {pinnedRows.map((item) => (
                  <SetProgressRow
                    key={item.set.id}
                    item={item}
                    onPinChange={handlePinChange}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {unpinnedRows.length > 0 ? (
            <section className="space-y-3">
              {pinnedRows.length > 0 ? (
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  All sets
                </h2>
              ) : null}
              <ul className="space-y-3">
                {unpinnedRows.map((item) => (
                  <SetProgressRow
                    key={item.set.id}
                    item={item}
                    onPinChange={handlePinChange}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
