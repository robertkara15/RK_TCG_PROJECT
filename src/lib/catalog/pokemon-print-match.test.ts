import { describe, expect, it } from "vitest";

import { isSamePokemonPrint } from "@/lib/catalog/pokemon-print-match";

const modernBudew = {
  hp: 30,
  stage: "Basic",
  evolveFrom: null,
  types: ["Grass"],
  attacks: [
    {
      name: "Itchy Pollen",
      damage: 10,
      effect:
        "During your opponent's next turn, they can't play any Item cards from their hand.",
    },
  ],
  abilities: null,
  retreat: 0,
  weaknesses: [{ type: "Fire", value: "+20" }],
  resistances: null,
};

describe("isSamePokemonPrint", () => {
  it("matches reprints with identical gameplay text", () => {
    expect(
      isSamePokemonPrint(modernBudew, {
        ...modernBudew,
        attacks: [
          {
            name: "Itchy Pollen",
            damage: "10",
            effect:
              "During your opponent's next turn, they can't play any Item cards from their hand.",
          },
        ],
      }),
    ).toBe(true);
  });

  it("rejects older prints with different attacks and stats", () => {
    expect(
      isSamePokemonPrint(modernBudew, {
        hp: 40,
        stage: "Basic",
        evolveFrom: null,
        types: ["Psychic"],
        attacks: [{ name: "Buddy-buddy", effect: "Search your deck for a Pokémon..." }],
        abilities: [
          {
            name: "Poison Enzyme",
            type: "Poke-BODY",
            effect: "Prevent all effects of attacks...",
          },
        ],
        retreat: 1,
        weaknesses: [{ type: "Fire", value: "+10" }],
        resistances: null,
      }),
    ).toBe(false);
  });

  it("matches reprints when evolveFrom is missing on one print", () => {
    expect(
      isSamePokemonPrint(
        {
          hp: 320,
          stage: "Stage2",
          evolveFrom: "Drakloak",
          types: ["Dragon"],
          attacks: [
            { name: "Jet Headbutt", damage: 70 },
            {
              name: "Phantom Dive",
              damage: 200,
              effect:
                "Put 6 damage counters on your opponent's Benched Pokémon in any way you like.",
            },
          ],
          abilities: null,
          retreat: 1,
          weaknesses: null,
          resistances: null,
        },
        {
          hp: 320,
          stage: "Stage2",
          evolveFrom: null,
          types: ["Dragon"],
          attacks: [
            { name: "Jet Headbutt", damage: 70 },
            {
              name: "Phantom Dive",
              damage: 200,
              effect:
                "Put 6 damage counters on your opponent's Benched Pokémon in any way you like.",
            },
          ],
          abilities: null,
          retreat: 1,
          weaknesses: null,
          resistances: null,
        },
      ),
    ).toBe(true);
  });

  it("rejects prints with conflicting evolveFrom values", () => {
    expect(
      isSamePokemonPrint(
        {
          hp: 100,
          stage: "Stage1",
          evolveFrom: "Pikachu",
          types: ["Lightning"],
          attacks: [{ name: "Thunder Shock", damage: 30 }],
          abilities: null,
          retreat: 1,
          weaknesses: null,
          resistances: null,
        },
        {
          hp: 100,
          stage: "Stage1",
          evolveFrom: "Pichu",
          types: ["Lightning"],
          attacks: [{ name: "Thunder Shock", damage: 30 }],
          abilities: null,
          retreat: 1,
          weaknesses: null,
          resistances: null,
        },
      ),
    ).toBe(false);
  });
});
