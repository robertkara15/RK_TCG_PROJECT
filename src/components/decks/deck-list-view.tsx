"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Folder = { id: string; name: string };
type Tag = { id: string; name: string; color: string | null };
type DeckSummary = {
  id: string;
  name: string;
  folderId: string | null;
  totalCards: number;
  warningCount: number;
  isValid: boolean;
  tags: Tag[];
};

export function DeckListView() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newDeckName, setNewDeckName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  const loadData = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedFolder !== "all") {
      params.set("folder", selectedFolder);
    }
    if (selectedTag) {
      params.set("tag", selectedTag);
    }

    const [decksRes, foldersRes, tagsRes] = await Promise.all([
      fetch(`/api/decks?${params.toString()}`),
      fetch("/api/folders"),
      fetch("/api/tags"),
    ]);

    const decksBody = await decksRes.json();
    const foldersBody = await foldersRes.json();
    const tagsBody = await tagsRes.json();

    setDecks(decksBody.data ?? []);
    setFolders(foldersBody.data ?? []);
    setAllTags(tagsBody.data ?? []);
    setIsLoading(false);
  }, [selectedFolder, selectedTag]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredDecks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return decks;
    }
    return decks.filter((deck) => deck.name.toLowerCase().includes(normalized));
  }, [decks, query]);

  async function handleCreateDeck(event: React.FormEvent) {
    event.preventDefault();
    if (!newDeckName.trim()) {
      return;
    }

    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newDeckName.trim(),
        folderId: selectedFolder !== "all" ? selectedFolder : null,
      }),
    });

    if (response.ok) {
      const body = await response.json();
      setNewDeckName("");
      window.location.href = `/decks/${body.data.id}`;
    }
  }

  async function handleCreateFolder(event: React.FormEvent) {
    event.preventDefault();
    if (!newFolderName.trim()) {
      return;
    }

    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });

    setNewFolderName("");
    await loadData();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 lg:sticky lg:top-4 lg:self-start">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Folders
        </h2>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setSelectedFolder("all")}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
              selectedFolder === "all"
                ? "bg-violet-600 text-white"
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            All decks
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolder(folder.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                selectedFolder === folder.id
                  ? "bg-violet-600 text-white"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {folder.name}
            </button>
          ))}
        </div>
        <form onSubmit={(event) => void handleCreateFolder(event)} className="space-y-2">
          <input
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="New folder"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
          <button
            type="submit"
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500"
          >
            Add folder
          </button>
        </form>
      </aside>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search decks…"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100"
          />
          <select
            value={selectedTag}
            onChange={(event) => setSelectedTag(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100"
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        <form
          onSubmit={(event) => void handleCreateDeck(event)}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={newDeckName}
            onChange={(event) => setNewDeckName(event.target.value)}
            placeholder="New deck name…"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            New deck
          </button>
        </form>

        {isLoading ? (
          <p className="text-sm text-zinc-500">Loading decks…</p>
        ) : filteredDecks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-400">
            No decks yet. Create one to start building.
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredDecks.map((deck) => (
              <li key={deck.id}>
                <Link
                  href={`/decks/${deck.id}`}
                  className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-600"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-white">{deck.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {deck.totalCards} cards
                        {deck.warningCount > 0
                          ? ` · ${deck.warningCount} warning${deck.warningCount === 1 ? "" : "s"}`
                          : " · valid"}
                      </p>
                    </div>
                    {deck.warningCount > 0 ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">
                        ⚠
                      </span>
                    ) : deck.totalCards === 60 ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300">
                        60
                      </span>
                    ) : null}
                  </div>
                  {deck.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {deck.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
