"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CardImage } from "@/components/card-image";
import { DeckCardGrid } from "@/components/decks/deck-card-grid";
import { DeckImportModal } from "@/components/decks/deck-import-modal";
import { DeckStatsPanel } from "@/components/decks/deck-stats-panel";
import type { DeckStats, ValidationWarning } from "@/lib/decks/types";

type DeckTag = { id: string; name: string; color: string | null };
type DeckCard = {
  cardName: string;
  normalizedName: string;
  quantity: number;
  category: string;
  trainerType: string | null;
  representativeCard: {
    id: string;
    name: string;
    imageUrl: string | null;
  } | null;
  nameIsStandardLegal: boolean;
  isAceSpec: boolean;
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    unresolved: string[];
  } | null>(null);

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => void deleteDeck()}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Delete deck
          </button>
        </div>
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

      <DeckStatsPanel stats={deck.stats} warnings={deck.validation.warnings} />

      {importSummary ? (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-sm">
          <p className="text-zinc-200">
            Imported {importSummary.imported} cards
            {importSummary.unresolved.length > 0
              ? ` · ${importSummary.unresolved.length} lines could not be matched`
              : "."}
          </p>
          {importSummary.unresolved.length > 0 ? (
            <ul className="mt-2 space-y-1 text-amber-200/90">
              {importSummary.unresolved.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            onClick={() => setImportSummary(null)}
            className="mt-2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Dismiss
          </button>
        </div>
      ) : null}

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
            <DeckCardGrid
              cards={deck.cards}
              stats={deck.stats}
              onSetQuantity={(normalizedName, cardName, quantity) =>
                void setCardQuantity(normalizedName, cardName, quantity)
              }
              onRemove={(normalizedName) => void removeCard(normalizedName)}
            />
          )}
      </div>

      {showImportModal ? (
        <DeckImportModal
          deckId={deckId}
          deckName={deck.deck.name}
          hasCards={deck.cards.length > 0}
          onClose={() => setShowImportModal(false)}
          onImported={(result) => {
            setImportSummary({
              imported: result.imported,
              unresolved: result.unresolved,
            });
            if (result.deck) {
              setDeck(result.deck as DeckDetail);
            } else {
              void loadDeck();
            }
          }}
        />
      ) : null}
    </div>
  );
}
