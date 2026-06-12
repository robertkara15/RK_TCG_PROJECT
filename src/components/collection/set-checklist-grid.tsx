"use client";

import Link from "next/link";

import { CardImage } from "@/components/card-image";
import { LegalityBadge } from "@/components/legality-badge";
import { CollectionAddButton } from "@/components/collection/collection-add-button";

export type SetChecklistCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  localId: string;
  rarity: string | null;
  category: string;
  nameIsStandardLegal: boolean;
  legalStandardPrint: boolean | null;
  quantity: number;
  owned: boolean;
};

export function SetChecklistGrid({
  cards,
  emptyMessage,
  onOwnershipChange,
  showFullColor = false,
}: {
  cards: SetChecklistCard[];
  emptyMessage: string;
  onOwnershipChange?: (cardId: string, owned: boolean, quantity: number) => void;
  showFullColor?: boolean;
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
      {cards.map((card) => {
        const dimMissing = !card.owned && !showFullColor;

        return (
        <div
          key={card.id}
          className={`relative rounded-xl border-2 p-3 transition ${
            card.owned
              ? "border-emerald-500/70 bg-emerald-950/40 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]"
              : showFullColor
                ? "border-dashed border-zinc-600/70 bg-zinc-900/50"
                : "border-zinc-800/50 bg-zinc-950/80"
          }`}
        >
          {card.owned ? (
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between rounded-t-[10px] bg-emerald-600/90 px-2 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white">
                Owned
              </span>
              {card.quantity > 0 ? (
                <span className="rounded-full bg-emerald-950/50 px-2 py-0.5 text-xs font-bold text-white">
                  ×{card.quantity}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="absolute inset-x-0 top-0 z-10 rounded-t-[10px] bg-zinc-900/90 px-2 py-1 text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Missing
              </span>
            </div>
          )}

          <Link href={`/cards/${card.id}`} className="group block pt-6">
            <CardImage
              imageUrl={card.imageUrl}
              name={card.name}
              className={`mx-auto mb-3 aspect-[5/7] w-full bg-zinc-950 transition ${
                dimMissing ? "opacity-25 grayscale" : ""
              }`}
            />
            <div className={`space-y-2 ${dimMissing ? "opacity-50" : ""}`}>
              <p
                className={`line-clamp-2 text-sm font-medium group-hover:text-violet-200 ${
                  card.owned || showFullColor ? "text-white" : "text-zinc-500"
                }`}
              >
                {card.name}
              </p>
              <p className="text-xs text-zinc-500">#{card.localId}</p>
              <LegalityBadge
                nameIsStandardLegal={card.nameIsStandardLegal}
                legalStandardPrint={card.legalStandardPrint}
                category={card.category}
                compact
              />
            </div>
          </Link>

          {!card.owned ? (
            <div className="mt-3">
              <CollectionAddButton
                cardId={card.id}
                onAdded={() => onOwnershipChange?.(card.id, true, 1)}
              />
            </div>
          ) : null}
        </div>
      );
      })}
    </div>
  );
}
