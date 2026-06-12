import { describe, expect, it } from "vitest";

import { parsePtcglDeckText } from "@/lib/decks/ptcgl-parser";

const SAMPLE = `Pokémon: 19
4 Slowpoke SCR 57
3 Slowking SCR 58
2 Mega Kangaskhan ex MEG 104
1 Meowth ex POR 62

Trainer: 31
4 Lillie's Determination MEG 119
4 Ultra Ball MEG 131

Energy: 10
4 Telepathic Psychic Energy POR 88
3 Psychic Energy MEE 5`;

describe("parsePtcglDeckText", () => {
  it("skips section headers and parses card lines", () => {
    const parsed = parsePtcglDeckText(SAMPLE);
    expect(parsed).toHaveLength(8);
    expect(parsed[0]).toMatchObject({
      quantity: 4,
      cardName: "Slowpoke",
      setCode: "SCR",
      cardNumber: "57",
    });
    expect(parsed[1]).toMatchObject({
      quantity: 3,
      cardName: "Slowking",
      setCode: "SCR",
      cardNumber: "58",
    });
  });

  it("parses names with apostrophes and ex suffixes", () => {
    const [line] = parsePtcglDeckText("4 Lillie's Determination MEG 119");
    expect(line).toMatchObject({
      quantity: 4,
      cardName: "Lillie's Determination",
      setCode: "MEG",
      cardNumber: "119",
    });
  });

  it("parses name-only lines", () => {
    const [line] = parsePtcglDeckText("3 Boss's Orders");
    expect(line).toMatchObject({
      quantity: 3,
      cardName: "Boss's Orders",
    });
  });
});
