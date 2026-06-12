import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardImage } from "@/components/card-image";
import { CollectionQuantity } from "@/components/collection-quantity";
import { LegalityBadge } from "@/components/legality-badge";
import {
  getCardById,
  getCollectionQuantity,
  getOtherPrints,
} from "@/lib/catalog/queries";
import { auth } from "@/auth";
import type { cards } from "@/lib/db/schema";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await getCardById(id);

  return {
    title: row ? `${row.card.name} — RK TCG` : "Card — RK TCG",
  };
}

export default async function CardDetailPage({ params }: PageProps) {
  const { id } = await params;
  const row = await getCardById(id);

  if (!row) {
    notFound();
  }

  const { card, set } = row;
  const [otherPrints, session] = await Promise.all([
    getOtherPrints(card.id, card.normalizedName),
    auth(),
  ]);
  const collectionQuantity =
    session?.user?.id != null
      ? await getCollectionQuantity(session.user.id, card.id)
      : 0;

  return (
    <div className="space-y-8">
      <Link href="/cards" className="text-sm text-zinc-400 transition hover:text-white">
        ← Back to cards
      </Link>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <CardImage
          imageUrl={card.imageUrl}
          name={card.name}
          quality="high"
          priority
          className="mx-auto w-full max-w-sm bg-zinc-950"
        />

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-white">{card.name}</h1>
            <p className="text-zinc-400">
              {set.name} · #{card.localId}
              {set.officialCount ? ` / ${set.officialCount}` : ""}
              {card.rarity ? ` · ${card.rarity}` : ""}
            </p>
            {card.illustrator ? (
              <p className="text-sm text-zinc-500">Illustrated by {card.illustrator}</p>
            ) : null}
            {card.regulationMark ? (
              <p className="text-sm text-zinc-400">Regulation: {card.regulationMark}</p>
            ) : null}
            <LegalityBadge
              nameIsStandardLegal={card.nameIsStandardLegal}
              legalStandardPrint={card.legalStandardPrint}
              category={card.category}
            />
            {card.isAceSpec ? (
              <p className="text-sm font-medium text-amber-300">
                ACE SPEC — max 1 per deck
              </p>
            ) : null}
            <CollectionQuantity
              cardId={card.id}
              initialQuantity={collectionQuantity}
            />
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Card details
            </h2>
            <CardDetails card={card} />
          </section>

          {otherPrints.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Other prints
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {otherPrints.map((print) => (
                  <Link
                    key={print.id}
                    href={`/cards/${print.id}`}
                    className="w-28 shrink-0 rounded-lg border border-zinc-800 p-2 transition hover:border-zinc-600"
                  >
                    <CardImage
                      imageUrl={print.imageUrl}
                      name={print.name}
                      className="mb-2 aspect-[5/7] w-full bg-zinc-950"
                    />
                    <p className="line-clamp-2 text-xs text-zinc-400">{print.setName}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CardDetails({ card }: { card: typeof cards.$inferSelect }) {
  if (card.category === "Pokemon") {
    return (
      <div className="space-y-4 text-sm text-zinc-300">
        <p>
          {card.hp ? `${card.hp} HP` : null}
          {Array.isArray(card.types) && card.types.length > 0
            ? ` · ${(card.types as string[]).join(" / ")}`
            : null}
          {card.stage ? ` · ${card.stage}` : null}
        </p>
        {card.evolveFrom ? <p>Evolves from {card.evolveFrom}</p> : null}
        {Array.isArray(card.abilities) && card.abilities.length > 0 ? (
          <div className="space-y-2">
            {(card.abilities as Array<{ name?: string; effect?: string }>).map((ability) => (
              <div key={ability.name}>
                <p className="font-medium text-white">{ability.name}</p>
                <p className="text-zinc-400">{ability.effect}</p>
              </div>
            ))}
          </div>
        ) : null}
        {Array.isArray(card.attacks) && card.attacks.length > 0 ? (
          <div className="space-y-2">
            {(card.attacks as Array<{ name?: string; damage?: string; effect?: string }>).map(
              (attack) => (
                <div key={attack.name}>
                  <p className="font-medium text-white">
                    {attack.name}
                    {attack.damage ? ` · ${attack.damage}` : ""}
                  </p>
                  {attack.effect ? <p className="text-zinc-400">{attack.effect}</p> : null}
                </div>
              ),
            )}
          </div>
        ) : null}
        {card.description ? <p className="text-zinc-400">{card.description}</p> : null}
      </div>
    );
  }

  if (card.category === "Trainer") {
    return (
      <div className="space-y-2 text-sm text-zinc-300">
        <p>{card.trainerType ? `Trainer · ${card.trainerType}` : "Trainer"}</p>
        {card.effect ? <p className="text-zinc-400">{card.effect}</p> : null}
      </div>
    );
  }

  if (card.category === "Energy") {
    return (
      <div className="space-y-2 text-sm text-zinc-300">
        <p>{card.energyType ? `${card.energyType} Energy` : "Energy"}</p>
        {card.effect ? <p className="text-zinc-400">{card.effect}</p> : null}
      </div>
    );
  }

  return <p className="text-sm text-zinc-500">Sync card details to view full card text.</p>;
}
