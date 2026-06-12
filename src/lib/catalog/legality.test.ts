import { describe, expect, it } from "vitest";

import {
  detectBasicEnergy,
  isBasicEnergyCardName,
} from "@/lib/catalog/legality";

describe("basic energy detection", () => {
  it("detects basic energy by name when tcgdx energy type is Normal", () => {
    expect(
      detectBasicEnergy("Energy", "Normal", "Psychic Energy"),
    ).toBe(true);
    expect(
      detectBasicEnergy("Energy", "Normal", "Basic Fire Energy"),
    ).toBe(true);
  });

  it("does not treat special energy as basic", () => {
    expect(
      detectBasicEnergy("Energy", "Normal", "Double Turbo Energy"),
    ).toBe(false);
    expect(isBasicEnergyCardName("Telepathic Psychic Energy")).toBe(false);
  });
});
