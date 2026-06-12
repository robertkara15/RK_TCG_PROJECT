import type { Metadata } from "next";

import { DeckListView } from "@/components/decks/deck-list-view";

export const metadata: Metadata = {
  title: "Decks — RK TCG",
};

export default function DecksPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Decks</h1>
        <p className="text-sm text-zinc-400">
          Build Standard decklists by card name with live stats and soft warnings.
        </p>
      </div>

      <DeckListView />
    </div>
  );
}
