"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CatalogCardGrid, type CatalogCardItem } from "@/components/catalog/catalog-card-grid";
import { CollectionAddButton } from "@/components/collection/collection-add-button";
import {
  SetChecklistGrid,
  type SetChecklistCard,
} from "@/components/collection/set-checklist-grid";
import { CardImage } from "@/components/card-image";
import { LegalityBadge } from "@/components/legality-badge";

type SetInfo = {
  id: string;
  name: string;
  officialCount: number;
};

type MissingCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  localId: string;
  rarity: string | null;
  category: string;
  nameIsStandardLegal: boolean;
  legalStandardPrint: boolean | null;
};

type ViewMode = "all" | "missing" | "owned";

export function SetDetailView({
  set,
  initialView,
  ownedCount,
  ownedPrintCount,
  completionPercent,
  initialMissingTotal,
}: {
  set: SetInfo;
  initialView: ViewMode;
  ownedCount: number;
  ownedPrintCount: number;
  completionPercent: number;
  initialMissingTotal: number;
}) {
  const [view, setView] = useState<ViewMode>(initialView);
  const [checklistCards, setChecklistCards] = useState<SetChecklistCard[]>([]);
  const [missingCards, setMissingCards] = useState<MissingCard[]>([]);
  const [ownedCards, setOwnedCards] = useState<CatalogCardItem[]>([]);
  const [checklistPage, setChecklistPage] = useState(1);
  const [missingPage, setMissingPage] = useState(1);
  const [ownedPage, setOwnedPage] = useState(1);
  const [checklistTotal, setChecklistTotal] = useState(0);
  const [missingTotal, setMissingTotal] = useState(initialMissingTotal);
  const [ownedTotal, setOwnedTotal] = useState(ownedPrintCount);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFullColor, setShowFullColor] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("collection-show-full-color");
    if (stored === "true") {
      setShowFullColor(true);
    }
  }, []);

  function updateShowFullColor(next: boolean) {
    setShowFullColor(next);
    window.localStorage.setItem("collection-show-full-color", String(next));
  }

  const fetchChecklist = useCallback(
    async (page: number, replace: boolean) => {
      setIsLoading(true);
      const response = await fetch(
        `/api/collection/sets/${set.id}?page=${page}&limit=60`,
      );
      const body = await response.json();
      setChecklistCards((current) =>
        replace ? body.data : [...current, ...body.data],
      );
      setChecklistPage(body.pagination.page);
      setChecklistTotal(body.pagination.total);
      setHasMore(
        body.data.length > 0 &&
          page * body.pagination.limit < body.pagination.total,
      );
      setIsLoading(false);
    },
    [set.id],
  );

  const fetchMissing = useCallback(
    async (page: number, replace: boolean) => {
      setIsLoading(true);
      const response = await fetch(
        `/api/collection/sets/${set.id}/missing?page=${page}&limit=60`,
      );
      const body = await response.json();
      setMissingCards((current) =>
        replace ? body.data : [...current, ...body.data],
      );
      setMissingPage(body.pagination.page);
      setMissingTotal(body.pagination.total);
      setHasMore(
        body.data.length > 0 &&
          page * body.pagination.limit < body.pagination.total,
      );
      setIsLoading(false);
    },
    [set.id],
  );

  const fetchOwned = useCallback(
    async (page: number, replace: boolean) => {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "40",
        sort: "number",
        set: set.id,
      });
      const response = await fetch(`/api/collection?${params.toString()}`);
      const body = await response.json();
      const mapped = (body.data as Array<CatalogCardItem & { quantity: number }>).map(
        (card) => ({
          ...card,
          quantity: card.quantity,
        }),
      );
      setOwnedCards((current) => (replace ? mapped : [...current, ...mapped]));
      setOwnedPage(body.pagination.page);
      setOwnedTotal(body.pagination.total);
      setHasMore(
        mapped.length > 0 &&
          page * body.pagination.limit < body.pagination.total,
      );
      setIsLoading(false);
    },
    [set.id],
  );

  useEffect(() => {
    setHasMore(true);
    if (view === "all") {
      void fetchChecklist(1, true);
    } else if (view === "missing") {
      void fetchMissing(1, true);
    } else {
      void fetchOwned(1, true);
    }
  }, [fetchChecklist, fetchMissing, fetchOwned, view]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          if (view === "all") {
            void fetchChecklist(checklistPage + 1, false);
          } else if (view === "missing") {
            void fetchMissing(missingPage + 1, false);
          } else {
            void fetchOwned(ownedPage + 1, false);
          }
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    checklistPage,
    fetchChecklist,
    fetchMissing,
    fetchOwned,
    hasMore,
    isLoading,
    missingPage,
    ownedPage,
    view,
  ]);

  const checklistOwnedCount = useMemo(
    () => checklistCards.filter((card) => card.owned).length,
    [checklistCards],
  );

  function handleChecklistOwnershipChange(
    cardId: string,
    owned: boolean,
    quantity: number,
  ) {
    setChecklistCards((current) =>
      current.map((card) =>
        card.id === cardId ? { ...card, owned, quantity } : card,
      ),
    );
    if (owned) {
      setMissingTotal((total) => Math.max(0, total - 1));
    }
  }

  function handleCardAdded(cardId: string) {
    setMissingCards((current) => current.filter((card) => card.id !== cardId));
    setMissingTotal((total) => Math.max(0, total - 1));
    setChecklistCards((current) =>
      current.map((card) =>
        card.id === cardId ? { ...card, owned: true, quantity: 1 } : card,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/collection/sets"
        className="text-sm text-zinc-400 transition hover:text-white"
      >
        ← Back to set progress
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">{set.name}</h1>
        <p className="text-sm text-zinc-400">
          {ownedCount.toLocaleString()} / {set.officialCount.toLocaleString()}{" "}
          card numbers · {completionPercent.toFixed(1)}% complete ·{" "}
          {missingTotal.toLocaleString()} prints missing
        </p>
        <div className="h-2 max-w-md overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-violet-600"
            style={{ width: `${Math.min(100, completionPercent)}%` }}
          />
        </div>
        {view === "all" && checklistCards.length > 0 ? (
          <p className="text-xs text-zinc-500">
            {showFullColor
              ? "All cards shown in full color. Owned vs missing is marked by the header bar and border."
              : "Owned cards are full color; missing cards are greyed out."}
            {checklistOwnedCount > 0
              ? ` Showing ${checklistOwnedCount} owned on this page.`
              : null}
          </p>
        ) : null}
      </div>

      {view === "all" || view === "missing" ? (
        <label className="flex w-fit items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={showFullColor}
            onChange={(event) => updateShowFullColor(event.target.checked)}
            className="rounded border-zinc-600 bg-zinc-900"
          />
          Show full-color card art
        </label>
      ) : null}

      <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 p-1">
        {(
          [
            { mode: "all" as const, label: "All cards", count: checklistTotal },
            { mode: "missing" as const, label: "Missing", count: missingTotal },
            { mode: "owned" as const, label: "Owned", count: ownedTotal },
          ] as const
        ).map((tab) => (
          <button
            key={tab.mode}
            type="button"
            onClick={() => setView(tab.mode)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              view === tab.mode
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {view === "all" ? (
        <SetChecklistGrid
          cards={checklistCards}
          emptyMessage="No cards found for this set."
          onOwnershipChange={handleChecklistOwnershipChange}
          showFullColor={showFullColor}
        />
      ) : view === "missing" ? (
        missingCards.length === 0 && !isLoading ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-400">
            You own every card in this set. Nice work!
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {missingCards.map((card) => (
              <li
                key={card.id}
                className="flex flex-wrap items-center gap-4 p-4"
              >
                <Link href={`/cards/${card.id}`} className="shrink-0">
                  <CardImage
                    imageUrl={card.imageUrl}
                    name={card.name}
                    className={`h-24 w-[4.5rem] bg-zinc-950 ${
                      showFullColor ? "" : "opacity-35 grayscale"
                    }`}
                  />
                </Link>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/cards/${card.id}`}
                      className="font-medium text-white hover:text-violet-200"
                    >
                      {card.name}
                    </Link>
                    {showFullColor ? (
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                        Missing
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-zinc-500">
                    #{card.localId}
                    {card.rarity ? ` · ${card.rarity}` : ""}
                  </p>
                  <LegalityBadge
                    nameIsStandardLegal={card.nameIsStandardLegal}
                    legalStandardPrint={card.legalStandardPrint}
                    category={card.category}
                    compact
                  />
                </div>
                <CollectionAddButton
                  cardId={card.id}
                  onAdded={() => handleCardAdded(card.id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <CatalogCardGrid
          cards={ownedCards}
          emptyMessage="You don't own any cards from this set yet."
        />
      )}

      <div ref={loadMoreRef} className="py-4 text-center text-sm text-zinc-500">
        {isLoading ? "Loading…" : hasMore ? "Scroll for more" : null}
      </div>
    </div>
  );
}
