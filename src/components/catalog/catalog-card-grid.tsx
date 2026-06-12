import Link from "next/link";

import { CardImage } from "@/components/card-image";
import { LegalityBadge } from "@/components/legality-badge";

export type CatalogCardItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  localId: string;
  regulationMark?: string | null;
  legalStandardPrint?: boolean | null;
  nameIsStandardLegal: boolean;
  category: string;
  set: {
    id: string;
    name: string;
  };
  quantity?: number;
};

export function CatalogCardGrid({
  cards,
  emptyMessage,
}: {
  cards: CatalogCardItem[];
  emptyMessage: string;
}) {
  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/cards/${card.id}`}
          className="group relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 transition hover:border-zinc-600 hover:bg-zinc-900"
        >
          {card.quantity != null && card.quantity > 0 ? (
            <span className="absolute right-2 top-2 z-10 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white">
              ×{card.quantity}
            </span>
          ) : null}
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
  );
}
