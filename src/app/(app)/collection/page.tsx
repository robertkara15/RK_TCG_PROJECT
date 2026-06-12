import type { Metadata } from "next";

import { CatalogBrowser } from "@/components/catalog/catalog-browser";

export const metadata: Metadata = {
  title: "Collection — RK TCG",
};

export default function CollectionPage() {
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Collection</h1>
        <p className="text-sm text-zinc-400">
          Search and filter the cards you own. Add cards from any card detail page.
        </p>
      </div>

      <CatalogBrowser
        apiPath="/api/collection"
        defaultSort="added_new"
        includeCollectionSort
        emptyMessage="Your collection is empty. Open a card and add it from the detail page."
        namePlaceholder="Search your collection by card name…"
      />
    </>
  );
}
