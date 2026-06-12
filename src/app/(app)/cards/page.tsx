import type { Metadata } from "next";
import Link from "next/link";

import { CardBrowse } from "@/components/card-browse";
import { listSets } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "Cards — RK TCG",
};

export default async function CardsPage() {
  const sets = await listSets();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Cards</h1>
          <p className="text-sm text-zinc-400">
            Browse and search the English card catalog.
          </p>
        </div>
        <Link
          href="/settings"
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          Sync catalog
        </Link>
      </div>

      <CardBrowse
        sets={sets.map((set) => ({
          id: set.id,
          name: set.name,
        }))}
      />
    </div>
  );
}
