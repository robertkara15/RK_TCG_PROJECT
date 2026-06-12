import { describe, expect, it } from "vitest";

import { parseCardSearchQuery } from "@/lib/catalog/parse-search-query";

const sets = [
  { id: "sv7", name: "Stellar Crown" },
  { id: "base1", name: "Base Set" },
  { id: "sv3", name: "Obsidian Flames" },
  { id: "wp", name: "W Promotional" },
];

describe("parseCardSearchQuery", () => {
  it("splits card name and set name from a combined query", () => {
    expect(parseCardSearchQuery("slowking stellar crown", sets)).toEqual({
      cardQuery: "slowking",
      setId: "sv7",
    });
  });

  it("matches set id in the query", () => {
    expect(parseCardSearchQuery("charizard sv7", sets)).toEqual({
      cardQuery: "charizard",
      setId: "sv7",
    });
  });

  it("falls back to the full query when no set matches", () => {
    expect(parseCardSearchQuery("ultra ball", sets)).toEqual({
      cardQuery: "ultra ball",
    });
  });

  it("does not treat set id substrings inside card names as set matches", () => {
    expect(parseCardSearchQuery("slowpoke", sets)).toEqual({
      cardQuery: "slowpoke",
    });
  });
});
