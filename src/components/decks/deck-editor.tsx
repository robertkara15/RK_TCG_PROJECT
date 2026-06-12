"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CardImage } from "@/components/card-image";
import { DeckStatsPanel } from "@/components/decks/deck-stats-panel";
import type { DeckStats, ValidationWarning } from "@/lib/decks/types";

type DeckTag = { id: string; name: string; color: string | null };
type DeckCard = {
  cardName: string;
  normalizedName: string;
  quantity: number;
  representativeCard: {
    id: string;
    name: string;
    imageUrl: string | null;
  } | null;
  nameIsStandardLegal: boolean;
};

type DeckDetail = {
  deck: {
    id: string;
    name: string;
    folderId: string | null;
    notes: string | null;
    tags: DeckTag[];
  };
  cards: DeckCard[];
  stats: DeckStats;
  validation: {
    isValid: boolean;
    warnings: ValidationWarning[];
  };
};

type SearchCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  nameIsStandardLegal: boolean;
  set: { id: string; name: string };
  localId: string;
};

export function DeckEditor({ deckId }: { deckId: string }) {
  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [allTags, setAllTags] = useState<DeckTag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadDeck = useCallback(async () => {
    const response = await fetch(`/api/decks/${deckId}`);
    if (!response.ok) {
      setIsLoading(false);
      return;
    }
    setDeck((await response.json()) as DeckDetail);
    setIsLoading(false);
  }, [deckId]);

  useEffect(() => {
    void loadDeck();
    void fetch("/api/folders")
      .then((response) => response.json())
      .then((body) => setFolders(body.data ?? []));
    void fetch("/api/tags")
      .then((response) => response.json())
      .then((body) => setAllTags(body.data ?? []));
  }, [loadDeck]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const query = searchQuery.trim();
      if (!query) {
        setSearchResults([]);
        return;
      }

      const params = new URLSearchParams({
        q: query,
        limit: "8",
        sort: "name_asc",
        standardLegal: "true",
      });
      const response = await fetch(`/api/cards?${params.toString()}`);
      const body = await response.json();
      setSearchResults(body.data ?? []);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const selectedTagIds = useMemo(
    () => new Set(deck?.deck.tags.map((tag) => tag.id) ?? []),
    [deck?.deck.tags],
  );

  async function saveDeckPatch(patch: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (response.ok) {
        setDeck((await response.json()) as DeckDetail);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function setCardQuantity(normalizedName: string, cardName: string, quantity: number) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardName, quantity, mode: "set" }),
      });
      if (response.ok) {
        setDeck((await response.json()) as DeckDetail);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function addCard(cardId: string) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, quantity: 1, mode: "add" }),
      });
      if (response.ok) {
        setDeck((await response.json()) as DeckDetail);
        setSearchQuery("");
        setSearchResults([]);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCard(normalizedName: string) {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/decks/${deckId}/cards/${encodeURIComponent(normalizedName)}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setDeck((await response.json()) as DeckDetail);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteDeck() {
    if (!window.confirm("Delete this deck?")) {
      return;
    }
    await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
    window.location.href = "/decks";
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading deck…</p>;
  }

  if (!deck) {
    return <p className="text-sm text-red-400">Deck not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/decks" className="text-sm text-zinc-400 hover:text-white">
          ← Decks
        </Link>
        <button
          type="button"
          onClick={() => void deleteDeck()}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Delete deck
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-3">
          <input
            value={deck.deck.name}
            onChange={(event) =>
              setDeck((current) =>
                current
                  ? {
                      ...current,
                      deck: { ...current.deck, name: event.target.value },
                    }
                  : current,
              )
            }
            onBlur={() => void saveDeckPatch({ name: deck.deck.name })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-2xl font-semibold text-white"
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={deck.deck.folderId ?? ""}
              onChange={(event) =>
                void saveDeckPatch({
                  folderId: event.target.value || null,
                })
              }
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <select
              value=""
              onChange={async (event) => {
                const tagId = event.target.value;
                if (!tagId || selectedTagIds.has(tagId)) {
                  return;
                }
                await saveDeckPatch({
                  tagIds: [...selectedTagIds, tagId],
                });
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Add tag…</option>
              {allTags
                .filter((tag) => !selectedTagIds.has(tag.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
          </div>
          {deck.deck.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {deck.deck.tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    void saveDeckPatch({
                      tagIds: deck.deck.tags
                        .filter((entry) => entry.id !== tag.id)
                        .map((entry) => entry.id),
                    })
                  }
                  className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700"
                >
                  {tag.name} ×
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {isSaving ? <p className="text-sm text-zinc-500">Saving…</p> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative z-20 min-w-0 space-y-4">
          <div className="relative z-50">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Standard-legal cards by name or name + set"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 caret-violet-400 outline-none ring-violet-500 focus:ring-2"
            />
            {searchQuery.trim() && searchResults.length > 0 ? (
              <ul className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-zinc-600 bg-zinc-950 shadow-2xl ring-1 ring-zinc-700">
                {searchResults.map((card) => (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => void addCard(card.id)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-900"
                    >
                      <CardImage
                        imageUrl={card.imageUrl}
                        name={card.name}
                        className="h-14 w-10 shrink-0 bg-zinc-900"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-white">
                          {card.name}
                        </span>
                        <span className="block text-xs text-zinc-400">
                          {card.set.name} · #{card.localId}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : searchQuery.trim() ? (
              <p className="absolute z-50 mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-400 shadow-xl">
                No Standard-legal cards found. Try a shorter name or include the set name.
              </p>
            ) : null}
          </div>

          {deck.cards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-400">
              Search to add your first card.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {deck.cards.map((card) => (
                <div
                  key={card.normalizedName}
                  className={`rounded-xl border p-3 ${
                    card.nameIsStandardLegal
                      ? "border-zinc-800 bg-zinc-900/40"
                      : "border-red-500/50 bg-red-950/20"
                  }`}
                >
                  <span className="mb-2 inline-block rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white">
                    ×{card.quantity}
                  </span>
                  {card.representativeCard ? (
                    <Link href={`/cards/${card.representativeCard.id}`}>
                      <CardImage
                        imageUrl={card.representativeCard.imageUrl}
                        name={card.cardName}
                        className="mb-3 aspect-[5/7] w-full bg-zinc-950"
                      />
                    </Link>
                  ) : (
                    <div className="mb-3 flex aspect-[5/7] items-center justify-center rounded-lg bg-zinc-800 px-2 text-center text-xs text-zinc-400">
                      {card.cardName}
                    </div>
                  )}
                  <p className="line-clamp-2 text-sm font-medium text-white">
                    {card.cardName}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void setCardQuantity(
                          card.normalizedName,
                          card.cardName,
                          Math.max(0, card.quantity - 1),
                        )
                      }
                      className="rounded border border-zinc-700 px-2 py-1 text-zinc-300"
                    >
                      −
                    </button>
                    <span className="text-sm text-white">{card.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        void setCardQuantity(
                          card.normalizedName,
                          card.cardName,
                          card.quantity + 1,
                        )
                      }
                      className="rounded border border-zinc-700 px-2 py-1 text-zinc-300"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCard(card.normalizedName)}
                      className="ml-auto text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-0 xl:order-2">
          <DeckStatsPanel stats={deck.stats} warnings={deck.validation.warnings} />
        </div>
      </div>
    </div>
  );
}
