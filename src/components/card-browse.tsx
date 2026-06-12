"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CardImage } from "@/components/card-image";
import { LegalityBadge } from "@/components/legality-badge";

type CardBrief = {
  id: string;
  name: string;
  imageUrl: string | null;
  localId: string;
  regulationMark: string | null;
  legalStandardPrint: boolean | null;
  nameIsStandardLegal: boolean;
  category: string;
  set: {
    id: string;
    name: string;
  };
};

type SetOption = {
  id: string;
  name: string;
};

type CardsResponse = {
  data: CardBrief[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

const CATEGORIES = ["Pokemon", "Trainer", "Energy"];

export function CardBrowse({ sets }: { sets: SetOption[] }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [setFilter, setSetFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [standardLegalOnly, setStandardLegalOnly] = useState(false);
  const [cards, setCards] = useState<CardBrief[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchCards = useCallback(
    async (nextPage: number, replace: boolean) => {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "40",
      });

      if (debouncedQuery) params.set("q", debouncedQuery);
      if (setFilter) params.set("set", setFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (standardLegalOnly) params.set("standardLegal", "true");

      const response = await fetch(`/api/cards?${params.toString()}`);
      const body = (await response.json()) as CardsResponse;

      setCards((current) => (replace ? body.data : [...current, ...body.data]));
      setPage(body.pagination.page);
      setTotal(body.pagination.total);
      setHasMore(body.data.length > 0 && nextPage * body.pagination.limit < body.pagination.total);
      setIsLoading(false);
    },
    [categoryFilter, debouncedQuery, setFilter, standardLegalOnly],
  );

  useEffect(() => {
    void fetchCards(1, true);
  }, [fetchCards]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchCards(page + 1, false);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchCards, hasMore, isLoading, page]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name…"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 outline-none ring-violet-500 focus:ring-2"
        />

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={standardLegalOnly}
              onChange={(event) => setStandardLegalOnly(event.target.checked)}
              className="rounded border-zinc-600 bg-zinc-900"
            />
            Standard legal
          </label>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={setFilter}
            onChange={(event) => setSetFilter(event.target.value)}
            className="min-w-48 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">All sets</option>
            {sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-zinc-500">
          {total.toLocaleString()} card{total === 1 ? "" : "s"} found
        </p>
      </div>

      {cards.length === 0 && !isLoading ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-400">
          No cards found. Try syncing the catalog in Settings first.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/cards/${card.id}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              <CardImage
                imageUrl={card.imageUrl}
                name={card.name}
                className="mx-auto mb-3 aspect-[5/7] w-full bg-zinc-950"
              />
              <div className="space-y-2">
                <p className="line-clamp-2 text-sm font-medium text-white group-hover:text-violet-200">
                  {card.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {card.set.name} · #{card.localId}
                </p>
                <LegalityBadge
                  nameIsStandardLegal={card.nameIsStandardLegal}
                  legalStandardPrint={card.legalStandardPrint}
                  category={card.category}
                  compact
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-4 text-center text-sm text-zinc-500">
        {isLoading ? "Loading cards…" : hasMore ? "Scroll for more" : null}
      </div>
    </div>
  );
}
