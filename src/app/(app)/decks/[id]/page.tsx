import type { Metadata } from "next";

import { DeckEditor } from "@/components/decks/deck-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Deck — RK TCG",
};

export default async function DeckDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <DeckEditor deckId={id} />;
}
