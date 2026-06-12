import { describe, expect, it } from "vitest";

import { buildCatalogMap, validateDeck } from "@/lib/decks/validate";
import type { CatalogCardMeta } from "@/lib/decks/types";
import { normalizeCardName } from "@/lib/catalog/normalize";

function meta(
  partial: Partial<CatalogCardMeta> & Pick<CatalogCardMeta, "name" | "category">,
): CatalogCardMeta {
  const normalizedName = normalizeCardName(partial.name);
  return {
    id: partial.id ?? normalizedName,
    normalizedName,
    stage: null,
    trainerType: null,
    energyType: null,
    nameIsStandardLegal: true,
    isAceSpec: false,
    isBasicEnergy: false,
    imageUrl: null,
    localId: "1",
    setReleaseDate: "2024-01-01",
    ...partial,
  };
}

function entry(cardName: string, quantity: number) {
  return {
    cardName,
    normalizedName: normalizeCardName(cardName),
    quantity,
  };
}

describe("validateDeck", () => {
  const catalog = buildCatalogMap([
    meta({ name: "Charizard ex", category: "Pokemon", stage: "Basic" }),
    meta({ name: "Ultra Ball", category: "Trainer", trainerType: "Item" }),
    meta({ name: "Professor's Research", category: "Trainer", trainerType: "Supporter" }),
    meta({ name: "Basic Fire Energy", category: "Energy", isBasicEnergy: true, energyType: "Basic" }),
    meta({ name: "Prime Catcher", category: "Trainer", isAceSpec: true, trainerType: "Item" }),
    meta({ name: "Hero's Cape", category: "Trainer", isAceSpec: true, trainerType: "Tool" }),
    meta({
      name: "Boss's Orders",
      category: "Trainer",
      trainerType: "Supporter",
      id: "swsh2-154",
      nameIsStandardLegal: true,
    }),
  ]);

  it("warns on copy limit but not for basic energy", () => {
    const result = validateDeck(
      [
        entry("Basic Fire Energy", 20),
        entry("Ultra Ball", 5),
        entry("Charizard ex", 2),
      ],
      catalog,
    );

    expect(result.stats.totalCards).toBe(27);
    expect(result.warnings.some((warning) => warning.ruleId === "COPY_LIMIT")).toBe(
      true,
    );
    expect(
      result.warnings.some(
        (warning) =>
          warning.ruleId === "COPY_LIMIT" &&
          warning.cardNames?.includes("Basic Fire Energy"),
      ),
    ).toBe(false);
  });

  it("warns when more than one ACE SPEC card is included", () => {
    const cards = [
      ...Array.from({ length: 14 }, () => entry("Charizard ex", 1)),
      entry("Prime Catcher", 1),
      entry("Hero's Cape", 1),
      entry("Basic Fire Energy", 44),
    ];

    const result = validateDeck(cards, catalog);
    expect(result.stats.totalCards).toBe(60);
    expect(result.warnings.some((warning) => warning.ruleId === "ACE_SPEC_LIMIT")).toBe(
      true,
    );
  });

  it("does not warn on Boss's Orders when a legal reprint exists", () => {
    const result = validateDeck([entry("Boss's Orders", 2)], catalog);
    expect(
      result.warnings.some((warning) => warning.ruleId === "STANDARD_LEGAL"),
    ).toBe(false);
  });

  it("does not warn on Psychic Energy even when catalog flags are stale", () => {
    const psychicCatalog = buildCatalogMap([
      meta({
        name: "Psychic Energy",
        category: "Energy",
        isBasicEnergy: false,
        nameIsStandardLegal: false,
      }),
    ]);

    const result = validateDeck([entry("Psychic Energy", 3)], psychicCatalog);
    expect(
      result.warnings.some((warning) => warning.ruleId === "STANDARD_LEGAL"),
    ).toBe(false);
  });

  it("warns when deck is not 60 cards", () => {
    const result = validateDeck([entry("Ultra Ball", 4)], catalog);
    expect(result.warnings.some((warning) => warning.ruleId === "DECK_SIZE")).toBe(
      true,
    );
  });
});
