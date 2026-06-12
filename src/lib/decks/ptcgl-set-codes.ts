/**
 * Pokémon TCG Live / Play! Pokémon set abbreviations mapped to TCGdex set ids.
 * Source: Play! Pokémon deck list abbreviations + PTCGL export codes.
 */
export const PTCGL_SET_CODES: Record<string, string> = {
  // Scarlet & Violet
  SVI: "sv01",
  PAL: "sv02",
  OBF: "sv03",
  MEW: "sv03.5",
  PAR: "sv04",
  PAF: "sv04.5",
  TEF: "sv05",
  TWM: "sv06",
  SFA: "sv06.5",
  SCR: "sv07",
  SSP: "sv08",
  PRE: "sv08.5",
  JTG: "sv09",
  DRI: "sv10",
  BLK: "sv10.5b",
  WHT: "sv10.5w",
  SVE: "sve",
  SVP: "svp",
  // Mega Evolution
  MEG: "me01",
  PFL: "me02",
  ASC: "me02.5",
  POR: "me03",
  CRI: "me04",
  MEE: "mee",
  MEP: "mep",
};

export function resolvePtcglSetId(setCode: string): string | null {
  const normalized = setCode.trim().toUpperCase();
  return PTCGL_SET_CODES[normalized] ?? null;
}
