"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CardImage } from "@/components/card-image";
import type { DeckStats } from "@/lib/decks/types";

export type DeckGridCard = {
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

type DeckViewFilter = "all" | "pokemon" | "trainer" | "energy";

type DeckCardGridProps = {
  cards: DeckGridCard[];
  stats: DeckStats;
  onSetQuantity: (
    normalizedName: string,
    cardName: string,
    quantity: number,
  ) => void;
  onRemove: (normalizedName: string) => void;
};

const VIEW_OPTIONS: { value: DeckViewFilter; label: string }[] = [
  { value: "all", label: "Normal" },
  { value: "pokemon", label: "Pokémon" },
  { value: "trainer", label: "Trainers" },
  { value: "energy", label: "Energy" },
];

const SECTIONS: {
  filter: Exclude<DeckViewFilter, "all">;
  label: string;
  categories: string[];
  countKey: keyof Pick<DeckStats, "pokemon" | "trainer" | "energy">;
}[] = [
  {
    filter: "pokemon",
    label: "Pokémon",
    categories: ["Pokemon"],
    countKey: "pokemon",
  },
  {
    filter: "trainer",
    label: "Trainers",
    categories: ["Trainer"],
    countKey: "trainer",
  },
  {
    filter: "energy",
    label: "Energy",
    categories: ["Energy"],
    countKey: "energy",
  },
];

const TRAINER_GROUPS: {
  type: string;
  label: string;
  borderClass: string;
  countKey: keyof DeckStats["trainers"];
}[] = [
  {
    type: "supporter",
    label: "Supporters",
    borderClass: "border-red-500",
    countKey: "supporter",
  },
  {
    type: "item",
    label: "Items",
    borderClass: "border-blue-500",
    countKey: "item",
  },
  {
    type: "tool",
    label: "Tools",
    borderClass: "border-purple-500",
    countKey: "tool",
  },
  {
    type: "stadium",
    label: "Stadiums",
    borderClass: "border-green-500",
    countKey: "stadium",
  },
];

const POKEMON_ENERGY_BORDER = "border-white";

function DeckCardTile({
  card,
  borderClassName,
  onSetQuantity,
  onRemove,
}: {
  card: DeckGridCard;
  borderClassName?: string;
  onSetQuantity: DeckCardGridProps["onSetQuantity"];
  onRemove: DeckCardGridProps["onRemove"];
}) {
  const tileClassName = card.isAceSpec
    ? "border-pink-500 bg-pink-950/45"
    : !card.nameIsStandardLegal
      ? "border-red-500/50 bg-red-950/20"
      : `${borderClassName ?? "border-zinc-800"} bg-zinc-900/40`;

  return (
    <div className={`rounded-lg border-2 p-1.5 ${tileClassName}`}>
      <div className="relative mb-1">
        <span className="absolute left-1 top-1 z-10 rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          ×{card.quantity}
        </span>
        {card.representativeCard ? (
          <Link href={`/cards/${card.representativeCard.id}`}>
            <CardImage
              imageUrl={card.representativeCard.imageUrl}
              name={card.cardName}
              className="aspect-[5/7] w-full bg-zinc-950"
            />
          </Link>
        ) : (
          <div className="flex aspect-[5/7] items-center justify-center rounded bg-zinc-800 px-1 text-center text-[10px] leading-tight text-zinc-400">
            {card.cardName}
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-[11px] font-medium leading-tight text-white">
        {card.cardName}
      </p>
      <div className="mt-1.5 flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            onSetQuantity(
              card.normalizedName,
              card.cardName,
              Math.max(0, card.quantity - 1),
            )
          }
          className="rounded border border-zinc-700 px-1 py-0.5 text-[10px] text-zinc-300"
        >
          −
        </button>
        <span className="min-w-[1ch] text-center text-[11px] text-white">
          {card.quantity}
        </span>
        <button
          type="button"
          onClick={() =>
            onSetQuantity(
              card.normalizedName,
              card.cardName,
              card.quantity + 1,
            )
          }
          className="rounded border border-zinc-700 px-1 py-0.5 text-[10px] text-zinc-300"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onRemove(card.normalizedName)}
          className="ml-auto text-[10px] text-red-400 hover:text-red-300"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function CardSection({
  title,
  count,
  cards,
  defaultBorderClass,
  getBorderClassName,
  onSetQuantity,
  onRemove,
}: {
  title: string;
  count: number;
  cards: DeckGridCard[];
  defaultBorderClass?: string;
  getBorderClassName?: (card: DeckGridCard) => string | undefined;
  onSetQuantity: DeckCardGridProps["onSetQuantity"];
  onRemove: DeckCardGridProps["onRemove"];
}) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">
        {title}{" "}
        <span className="font-normal text-zinc-500">({count})</span>
      </h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {cards.map((card) => (
          <DeckCardTile
            key={card.normalizedName}
            card={card}
            borderClassName={
              getBorderClassName?.(card) ?? defaultBorderClass
            }
            onSetQuantity={onSetQuantity}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}

function TrainerSection({
  count,
  cards,
  stats,
  onSetQuantity,
  onRemove,
}: {
  count: number;
  cards: DeckGridCard[];
  stats: DeckStats;
  onSetQuantity: DeckCardGridProps["onSetQuantity"];
  onRemove: DeckCardGridProps["onRemove"];
}) {
  const grouped = useMemo(() => {
    const byType = new Map<string, DeckGridCard[]>();
    const other: DeckGridCard[] = [];

    for (const card of cards) {
      const type = card.trainerType?.toLowerCase() ?? "";
      const knownGroup = TRAINER_GROUPS.find((group) => group.type === type);
      if (knownGroup) {
        const list = byType.get(type) ?? [];
        list.push(card);
        byType.set(type, list);
      } else {
        other.push(card);
      }
    }

    for (const list of byType.values()) {
      list.sort((a, b) => a.cardName.localeCompare(b.cardName));
    }
    other.sort((a, b) => a.cardName.localeCompare(b.cardName));

    return { byType, other };
  }, [cards]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300">
        Trainers <span className="font-normal text-zinc-500">({count})</span>
      </h3>

      {TRAINER_GROUPS.map((group) => {
        const groupCards = grouped.byType.get(group.type) ?? [];
        if (groupCards.length === 0) {
          return null;
        }

        return (
          <div key={group.type} className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {group.label}{" "}
              <span className="normal-case text-zinc-600">
                ({stats.trainers[group.countKey]})
              </span>
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {groupCards.map((card) => (
                <DeckCardTile
                  key={card.normalizedName}
                  card={card}
                  borderClassName={group.borderClass}
                  onSetQuantity={onSetQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </div>
        );
      })}

      {grouped.other.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Other{" "}
            <span className="normal-case text-zinc-600">
              (
              {grouped.other.reduce(
                (total, card) => total + card.quantity,
                0,
              )}
              )
            </span>
          </h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {grouped.other.map((card) => (
              <DeckCardTile
                key={card.normalizedName}
                card={card}
                onSetQuantity={onSetQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function DeckCardGrid({
  cards,
  stats,
  onSetQuantity,
  onRemove,
}: DeckCardGridProps) {
  const [viewFilter, setViewFilter] = useState<DeckViewFilter>("all");

  const cardsBySection = useMemo(() => {
    const sorted = [...cards].sort((a, b) =>
      a.cardName.localeCompare(b.cardName),
    );

    const grouped = {
      pokemon: [] as DeckGridCard[],
      trainer: [] as DeckGridCard[],
      energy: [] as DeckGridCard[],
      unknown: [] as DeckGridCard[],
    };

    for (const card of sorted) {
      if (card.category === "Pokemon") {
        grouped.pokemon.push(card);
      } else if (card.category === "Trainer") {
        grouped.trainer.push(card);
      } else if (card.category === "Energy") {
        grouped.energy.push(card);
      } else {
        grouped.unknown.push(card);
      }
    }

    return grouped;
  }, [cards]);

  const visibleSections =
    viewFilter === "all"
      ? SECTIONS
      : SECTIONS.filter((section) => section.filter === viewFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {VIEW_OPTIONS.map((option) => {
          const isActive = viewFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setViewFilter(option.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-violet-600 text-white"
                  : "border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              {option.label}
              {option.value !== "all" ? (
                <span className="ml-1 opacity-80">
                  (
                  {option.value === "pokemon"
                    ? stats.pokemon
                    : option.value === "trainer"
                      ? stats.trainer
                      : stats.energy}
                  )
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {visibleSections.map((section) =>
          section.filter === "trainer" ? (
            <TrainerSection
              key={section.filter}
              count={stats.trainer}
              cards={cardsBySection.trainer}
              stats={stats}
              onSetQuantity={onSetQuantity}
              onRemove={onRemove}
            />
          ) : (
            <CardSection
              key={section.filter}
              title={section.label}
              count={stats[section.countKey]}
              cards={cardsBySection[section.filter]}
              defaultBorderClass={POKEMON_ENERGY_BORDER}
              onSetQuantity={onSetQuantity}
              onRemove={onRemove}
            />
          ),
        )}

        {viewFilter === "all" && cardsBySection.unknown.length > 0 ? (
          <CardSection
            title="Unknown"
            count={cardsBySection.unknown.reduce(
              (total, card) => total + card.quantity,
              0,
            )}
            cards={cardsBySection.unknown}
            onSetQuantity={onSetQuantity}
            onRemove={onRemove}
          />
        ) : null}
      </div>
    </div>
  );
}
