import type { formatConfig } from "@/lib/db/schema";

export type FormatConfig = typeof formatConfig.$inferSelect;

export type LegalityCard = {
  regulationMark: string | null;
  normalizedName?: string;
  category?: string;
};

const DEFAULT_LEGAL_MARKS = ["H", "I", "J"] as const;

/**
 * 2026 Standard: H, I, J, and any future regulation mark after J are legal.
 * G and all prior marks (A–G) are rotated out.
 */
export function isRegulationMarkLegal(
  regulationMark: string,
  config: FormatConfig,
): boolean {
  const mark = regulationMark.trim().toUpperCase();
  if (!mark) {
    return false;
  }

  const letter = mark.charAt(0);

  if (config.acceptFutureMarks && letter > "J") {
    return true;
  }

  const legalMarks = config.legalMarks ?? [...DEFAULT_LEGAL_MARKS];
  return legalMarks.map((m) => m.toUpperCase()).includes(letter);
}

/**
 * Print-level Standard legality — regulation mark H+ on this specific print.
 */
export function isPrintStandardLegal(
  card: LegalityCard,
  config: FormatConfig,
): boolean {
  if (!card.regulationMark) {
    return false;
  }

  return isRegulationMarkLegal(card.regulationMark, config);
}

export function usesReprintRule(category: string | null | undefined): boolean {
  return category === "Trainer" || category === "Energy";
}

/**
 * Whether this specific print is playable in Standard.
 * Pokémon: this print's regulation mark only (no reprint rule).
 * Trainer/Energy: tournament reprint rule at the card-name level.
 */
export function isPlayableInStandard(
  card: LegalityCard & { normalizedName: string; category: string },
  catalog: Array<LegalityCard & { normalizedName: string; category: string }>,
  config: FormatConfig,
): boolean {
  if (card.category === "Pokemon") {
    return isPrintStandardLegal(card, config);
  }

  if (usesReprintRule(card.category)) {
    return isNameStandardLegalForCategory(
      card.normalizedName,
      card.category,
      catalog,
      config,
    );
  }

  return isPrintStandardLegal(card, config);
}

/**
 * Tournament reprint rule — Trainer/Energy only.
 * A card name is legal if any print of that name in the same category has H+.
 */
export function isNameStandardLegalForCategory(
  normalizedName: string,
  category: string,
  catalog: Array<LegalityCard & { normalizedName: string; category: string }>,
  config: FormatConfig,
): boolean {
  return catalog
    .filter(
      (entry) =>
        entry.normalizedName === normalizedName && entry.category === category,
    )
    .some((entry) => isPrintStandardLegal(entry, config));
}

export function detectAceSpec(
  rarity: string | null | undefined,
  effect: string | null | undefined,
  description: string | null | undefined,
): boolean {
  if (rarity?.toUpperCase().includes("ACE SPEC")) {
    return true;
  }

  const rulesText = `${effect ?? ""} ${description ?? ""}`.toUpperCase();
  return rulesText.includes("ACE SPEC");
}

const BASIC_ENERGY_TYPES =
  "grass|fire|water|lightning|psychic|fighting|darkness|dark|metal|fairy|colorless";

export const BASIC_ENERGY_NAME_PATTERN = new RegExp(
  `^(?:basic )?(?:${BASIC_ENERGY_TYPES}) energy$`,
  "i",
);

export function isBasicEnergyCardName(name: string): boolean {
  return BASIC_ENERGY_NAME_PATTERN.test(name.trim());
}

/** Map any energy card name to its basic type name, e.g. "Telepathic Psychic Energy" → "Psychic Energy". */
export function getBasicEnergyNameForDisplay(name: string): string | null {
  const trimmed = name.trim();
  if (isBasicEnergyCardName(trimmed)) {
    const match = trimmed.match(
      new RegExp(`^(?:basic\\s+)?(${BASIC_ENERGY_TYPES}) energy$`, "i"),
    );
    if (!match) {
      return null;
    }
    const raw = match[1].toLowerCase();
    const label =
      raw === "dark"
        ? "Darkness"
        : raw.charAt(0).toUpperCase() + raw.slice(1);
    return `${label} Energy`;
  }

  const lower = trimmed.toLowerCase();
  if (!lower.endsWith(" energy")) {
    return null;
  }

  const orderedTypes = [
    "darkness",
    "colorless",
    "lightning",
    "fighting",
    "psychic",
    "grass",
    "fire",
    "water",
    "metal",
    "fairy",
    "dark",
  ];

  for (const type of orderedTypes) {
    if (!lower.includes(type)) {
      continue;
    }
    const label =
      type === "dark"
        ? "Darkness"
        : type.charAt(0).toUpperCase() + type.slice(1);
    return `${label} Energy`;
  }

  return null;
}

export function detectBasicEnergy(
  category: string,
  energyType: string | null | undefined,
  name?: string | null,
): boolean {
  if (category !== "Energy") {
    return false;
  }

  if (energyType === "Basic") {
    return true;
  }

  if (name && isBasicEnergyCardName(name)) {
    return true;
  }

  return false;
}
