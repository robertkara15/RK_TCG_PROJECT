/**
 * Pokémon TCG Pocket sets in TCGdex — digital-only, not physical prints.
 * Identified by set id and/or image URLs under assets.tcgdex.net/.../tcgp/...
 */
export const POCKET_SET_IDS = new Set([
  "A1",
  "A1a",
  "A2",
  "A2a",
  "A2b",
  "A3",
  "A3a",
  "A3b",
  "A4",
  "A4a",
  "B1",
  "B2",
  "P-A",
]);

export function isPocketSet(setId: string): boolean {
  return POCKET_SET_IDS.has(setId);
}

export function isPocketCard(
  cardId: string,
  setId: string,
  imageUrl?: string | null,
): boolean {
  if (isPocketSet(setId)) {
    return true;
  }

  if (imageUrl?.includes("/tcgp/")) {
    return true;
  }

  // Pocket card ids use pocket set prefixes (e.g. A2b-001, P-A-001).
  const prefix = cardId.split("-")[0] ?? "";
  return POCKET_SET_IDS.has(prefix);
}
