"use client";

import { useState } from "react";

type ImportResult = {
  imported: number;
  unresolved: string[];
  deck?: unknown;
};

export function DeckImportModal({
  deckId,
  deckName,
  hasCards,
  onClose,
  onImported,
}: {
  deckId: string;
  deckName: string;
  hasCards: boolean;
  onClose: () => void;
  onImported: (result: ImportResult) => void;
}) {
  const [text, setText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Paste a deck list first.");
      return;
    }

    if (
      hasCards &&
      !window.confirm(
        "This deck already has cards. Importing will replace the entire deck. Continue?",
      )
    ) {
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/decks/${deckId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Import failed.");
        return;
      }

      onImported(body as ImportResult);
      onClose();
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-labelledby="import-deck-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
      >
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 id="import-deck-title" className="text-lg font-semibold text-white">
            Import TCG Live deck
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Paste a deck list exported from Pokémon TCG Live into{" "}
            <span className="text-zinc-300">{deckName}</span>.
          </p>
          {hasCards ? (
            <p className="mt-2 text-sm text-amber-300">
              This deck already has cards. Importing will replace everything in
              the deck.
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={`Pokémon: 19\n4 Slowpoke SCR 57\n3 Slowking SCR 58\n...\n\nTrainer: 31\n...\n\nEnergy: 10\n...`}
            rows={16}
            className="h-full min-h-64 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-violet-500 focus:ring-2"
          />
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={isImporting}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {isImporting ? "Importing…" : hasCards ? "Replace deck" : "Import deck"}
          </button>
        </div>
      </div>
    </div>
  );
}
