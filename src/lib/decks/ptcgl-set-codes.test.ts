import { describe, expect, it } from "vitest";

import { resolvePtcglSetId } from "@/lib/decks/ptcgl-set-codes";

describe("resolvePtcglSetId", () => {
  it("maps PRE to Prismatic Evolutions and POR to Perfect Order", () => {
    expect(resolvePtcglSetId("PRE")).toBe("sv08.5");
    expect(resolvePtcglSetId("POR")).toBe("me03");
  });
});
