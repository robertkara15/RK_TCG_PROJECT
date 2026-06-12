"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CatalogCardGrid, type CatalogCardItem } from "@/components/catalog/catalog-card-grid";
import {
  CatalogFilters,
  type CatalogFacets,
} from "@/components/catalog/catalog-filters";
import { CatalogSort } from "@/components/catalog/catalog-sort";
import {
  countActiveFilters,
  DEFAULT_FILTER_STATE,
  filtersToSearchParams,
  type CatalogFilterState,
} from "@/components/catalog/filter-state";

type BrowseResponse = {
  data: CatalogCardItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  stats?: {
    uniqueCards: number;
    totalCopies: number;
    filteredCards: number;
  };
};

export function CatalogBrowser({
  apiPath,
  defaultSort = "name_asc",
  includeCollectionSort = false,
  emptyMessage,
  namePlaceholder = "Search by card name…",
}: {
  apiPath: "/api/cards" | "/api/collection";
  defaultSort?: CatalogFilterState["sort"];
  includeCollectionSort?: boolean;
  emptyMessage: string;
  namePlaceholder?: string;
}) {
  const [filters, setFilters] = useState<CatalogFilterState>({
    ...DEFAULT_FILTER_STATE,
    sort: defaultSort,
  });
  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [cards, setCards] = useState<CatalogCardItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<BrowseResponse["stats"]>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedName(nameQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [nameQuery]);

  useEffect(() => {
    void fetch("/api/catalog/facets")
      .then((response) => response.json())
      .then((body) => setFacets(body as CatalogFacets));
  }, []);

  const activeFilters = useMemo(
    () => ({ ...filters, q: debouncedName || undefined }),
    [filters, debouncedName],
  );
  const activeCount = countActiveFilters(activeFilters);
  const filterQuery = useMemo(
    () => filtersToSearchParams(activeFilters, 1).toString(),
    [activeFilters],
  );

  const fetchItems = useCallback(
    async (nextPage: number, replace: boolean) => {
      setIsLoading(true);
      const params = filtersToSearchParams(activeFilters, nextPage);
      const response = await fetch(`${apiPath}?${params.toString()}`);
      const body = (await response.json()) as BrowseResponse;

      setCards((current) => (replace ? body.data : [...current, ...body.data]));
      setPage(body.pagination.page);
      setTotal(body.pagination.total);
      setStats(body.stats);
      setHasMore(
        body.data.length > 0 &&
          nextPage * body.pagination.limit < body.pagination.total,
      );
      setIsLoading(false);
    },
    [activeFilters, apiPath],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiPath}?${filterQuery}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as BrowseResponse;
        if (cancelled) {
          return;
        }

        setCards(body.data);
        setPage(body.pagination.page);
        setTotal(body.pagination.total);
        setStats(body.stats);
        setHasMore(
          body.data.length > 0 &&
            body.pagination.page * body.pagination.limit < body.pagination.total,
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filterQuery, apiPath]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchItems(page + 1, false);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchItems, hasMore, isLoading, page]);

  function updateFilters(patch: Partial<CatalogFilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setNameQuery("");
    setFilters({ sort: filters.sort });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 space-y-3">
          <input
            type="search"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
            placeholder={namePlaceholder}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 outline-none ring-violet-500 focus:ring-2"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((open) => !open)}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              {showFilters ? "Hide filters" : "Filters"}
              {activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
            <CatalogSort
              value={filters.sort}
              onChange={(sort) => updateFilters({ sort })}
              includeCollectionSort={includeCollectionSort}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {showFilters ? (
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <CatalogFilters
              filters={activeFilters}
              facets={facets}
              onChange={updateFilters}
              onClear={clearFilters}
              activeCount={activeCount}
            />
          </aside>
        ) : null}

        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            {apiPath === "/api/collection" && stats ? (
              <>
                Showing {stats.filteredCards.toLocaleString()} of{" "}
                {stats.uniqueCards.toLocaleString()} cards (
                {stats.totalCopies.toLocaleString()} total copies)
              </>
            ) : (
              <>
                {total.toLocaleString()} card{total === 1 ? "" : "s"} found
              </>
            )}
          </p>

          <CatalogCardGrid cards={cards} emptyMessage={emptyMessage} />

          <div ref={loadMoreRef} className="py-4 text-center text-sm text-zinc-500">
            {isLoading ? "Loading…" : hasMore ? "Scroll for more" : null}
          </div>
        </div>
      </div>
    </div>
  );
}
