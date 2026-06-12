import { describe, expect, it } from "vitest";

import { getBasicEnergyNameForDisplay } from "@/lib/catalog/legality";
import { normalizeCardName } from "@/lib/catalog/normalize";
import { buildCatalogMap } from "@/lib/decks/validate";
import type { CatalogCardMeta } from "@/lib/decks/types";
import { resolveEnergyDisplayImage } from "@/lib/decks/resolve-card-image";

describe("getBasicEnergyNameForDisplay", () => {
  it("normalizes basic energy names", () => {
    expect(getBasicEnergyNameForDisplay("Grass Energy")).toBe("Grass Energy");
    expect(getBasicEnergyNameForDisplay("Basic Fire Energy")).toBe("Fire Energy");
  });

  it("maps special energy names to a basic type", () => {
    expect(getBasicEnergyNameForDisplay("Telepathic Psychic Energy")).toBe(
      "Psychic Energy",
    );
  });
});

describe("resolveEnergyDisplayImage", () => {
  it("falls back to the newest basic energy print with an image", () => {
    const catalog = buildCatalogMap([
      {
        id: "sve-017",
        name: "Grass Energy",
        normalizedName: normalizeCardName("Grass Energy"),
        category: "Energy",
        stage: null,
        trainerType: null,
        energyType: null,
        nameIsStandardLegal: true,
        isAceSpec: false,
        isBasicEnergy: true,
        imageUrl: null,
        localId: "017",
        setReleaseDate: "2024-03-01",
      },
      {
        id: "swsh12.5-152",
        name: "Grass Energy",
        normalizedName: normalizeCardName("Grass Energy"),
        category: "Energy",
        stage: null,
        trainerType: null,
        energyType: null,
        nameIsStandardLegal: true,
        isAceSpec: false,
        isBasicEnergy: true,
        imageUrl: "https://assets.tcgdex.net/en/swsh/swsh12.5/152",
        localId: "152",
        setReleaseDate: "2023-01-20",
      },
    ] satisfies CatalogCardMeta[]);

    const representative = catalog.get(normalizeCardName("Grass Energy"))![0];
    expect(
      resolveEnergyDisplayImage(representative, catalog),
    ).toBe("https://assets.tcgdex.net/en/swsh/swsh12.5/152");
  });
});
