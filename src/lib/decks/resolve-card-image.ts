import { getBasicEnergyNameForDisplay } from "@/lib/catalog/legality";
import { normalizeCardName } from "@/lib/catalog/normalize";
import type { CatalogCardMeta } from "@/lib/decks/types";

function pickNewestPrintWithImage(prints: CatalogCardMeta[]): CatalogCardMeta | null {
  return (
    [...prints]
      .filter((print) => Boolean(print.imageUrl))
      .sort(
        (a, b) =>
          (b.setReleaseDate ?? "").localeCompare(a.setReleaseDate ?? "") ||
          a.localId.localeCompare(b.localId, undefined, { numeric: true }),
      )[0] ?? null
  );
}

export function resolveEnergyDisplayImage(
  representative: CatalogCardMeta,
  catalogByName: Map<string, CatalogCardMeta[]>,
): string | null {
  if (representative.imageUrl) {
    return representative.imageUrl;
  }

  const basicName = getBasicEnergyNameForDisplay(representative.name);
  if (!basicName) {
    return null;
  }

  const prints = catalogByName.get(normalizeCardName(basicName)) ?? [];
  return pickNewestPrintWithImage(prints)?.imageUrl ?? null;
}

export function resolveCardDisplayImage(
  representative: CatalogCardMeta | null,
  catalogByName: Map<string, CatalogCardMeta[]>,
): string | null {
  if (!representative) {
    return null;
  }

  if (representative.category === "Energy") {
    return resolveEnergyDisplayImage(representative, catalogByName);
  }

  return representative.imageUrl;
}

export function collectEnergyFallbackCatalogNames(
  entries: { normalizedName: string }[],
  catalogByName: Map<string, CatalogCardMeta[]>,
): string[] {
  const extras = new Set<string>();

  for (const entry of entries) {
    const prints = catalogByName.get(entry.normalizedName) ?? [];
    if (!prints.some((print) => print.category === "Energy")) {
      continue;
    }

    const basicName = getBasicEnergyNameForDisplay(prints[0]?.name ?? "");
    if (!basicName) {
      continue;
    }

    const normalizedBasic = normalizeCardName(basicName);
    if (normalizedBasic === entry.normalizedName) {
      continue;
    }

    extras.add(normalizedBasic);
  }

  return [...extras];
}
