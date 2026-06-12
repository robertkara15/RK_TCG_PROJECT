import {
  EMPTY_DECK_STATS,
  type CatalogCardMeta,
  type DeckCardEntry,
  type DeckStats,
  type ValidationResult,
  type ValidationWarning,
} from "@/lib/decks/types";

function getCatalogForName(
  catalogByName: Map<string, CatalogCardMeta[]>,
  normalizedName: string,
): CatalogCardMeta[] {
  return catalogByName.get(normalizedName) ?? [];
}

function pickMeta(
  catalogByName: Map<string, CatalogCardMeta[]>,
  normalizedName: string,
): CatalogCardMeta | null {
  const prints = getCatalogForName(catalogByName, normalizedName);
  if (prints.length === 0) {
    return null;
  }

  return (
    [...prints].sort((a, b) => {
      if (a.nameIsStandardLegal !== b.nameIsStandardLegal) {
        return a.nameIsStandardLegal ? -1 : 1;
      }
      return (
        (b.setReleaseDate ?? "").localeCompare(a.setReleaseDate ?? "") ||
        a.localId.localeCompare(b.localId, undefined, { numeric: true })
      );
    })[0] ?? null
  );
}

function isBasicEnergyName(
  catalogByName: Map<string, CatalogCardMeta[]>,
  normalizedName: string,
): boolean {
  return getCatalogForName(catalogByName, normalizedName).some(
    (card) => card.isBasicEnergy,
  );
}

function isAceSpecName(
  catalogByName: Map<string, CatalogCardMeta[]>,
  normalizedName: string,
): boolean {
  return getCatalogForName(catalogByName, normalizedName).some(
    (card) => card.isAceSpec,
  );
}

function isNameStandardLegal(
  catalogByName: Map<string, CatalogCardMeta[]>,
  normalizedName: string,
): boolean {
  return getCatalogForName(catalogByName, normalizedName).some(
    (card) => card.nameIsStandardLegal,
  );
}

function hasBasicPokemon(
  catalogByName: Map<string, CatalogCardMeta[]>,
  normalizedName: string,
): boolean {
  return getCatalogForName(catalogByName, normalizedName).some(
    (card) => card.category === "Pokemon" && card.stage === "Basic",
  );
}

function computeStats(
  entries: DeckCardEntry[],
  catalogByName: Map<string, CatalogCardMeta[]>,
): DeckStats {
  const stats: DeckStats = {
    ...EMPTY_DECK_STATS,
    trainers: { ...EMPTY_DECK_STATS.trainers },
    pokemonBreakdown: { ...EMPTY_DECK_STATS.pokemonBreakdown },
    energyBreakdown: { ...EMPTY_DECK_STATS.energyBreakdown },
  };

  for (const entry of entries) {
    const meta = pickMeta(catalogByName, entry.normalizedName);
    stats.totalCards += entry.quantity;

    if (!meta) {
      continue;
    }

    if (meta.category === "Pokemon") {
      stats.pokemon += entry.quantity;
      if (meta.stage === "Basic") {
        stats.pokemonBreakdown.basic += entry.quantity;
      } else if (meta.stage === "Stage 1") {
        stats.pokemonBreakdown.stage1 += entry.quantity;
      } else if (meta.stage === "Stage 2") {
        stats.pokemonBreakdown.stage2 += entry.quantity;
      } else {
        stats.pokemonBreakdown.other += entry.quantity;
      }
    } else if (meta.category === "Trainer") {
      stats.trainer += entry.quantity;
      const trainerType = meta.trainerType?.toLowerCase() ?? "";
      if (trainerType === "supporter") {
        stats.trainers.supporter += entry.quantity;
      } else if (trainerType === "item") {
        stats.trainers.item += entry.quantity;
      } else if (trainerType === "stadium") {
        stats.trainers.stadium += entry.quantity;
      } else if (trainerType === "tool") {
        stats.trainers.tool += entry.quantity;
      } else {
        stats.trainers.other += entry.quantity;
      }
    } else if (meta.category === "Energy") {
      stats.energy += entry.quantity;
      if (meta.isBasicEnergy) {
        stats.energyBreakdown.basic += entry.quantity;
      } else {
        stats.energyBreakdown.special += entry.quantity;
      }
    }

    if (isAceSpecName(catalogByName, entry.normalizedName)) {
      stats.aceSpecCount += entry.quantity;
    }
  }

  return stats;
}

export function buildCatalogMap(
  catalog: CatalogCardMeta[],
): Map<string, CatalogCardMeta[]> {
  const map = new Map<string, CatalogCardMeta[]>();

  for (const card of catalog) {
    const existing = map.get(card.normalizedName) ?? [];
    existing.push(card);
    map.set(card.normalizedName, existing);
  }

  return map;
}

export function validateDeck(
  entries: DeckCardEntry[],
  catalogByName: Map<string, CatalogCardMeta[]>,
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const stats = computeStats(entries, catalogByName);

  if (stats.totalCards !== 60) {
    warnings.push({
      ruleId: "DECK_SIZE",
      severity: "warning",
      message: `Deck has ${stats.totalCards}/60 cards`,
    });
  }

  const quantityByName = new Map<string, { cardName: string; quantity: number }>();
  for (const entry of entries) {
    const current = quantityByName.get(entry.normalizedName);
    quantityByName.set(entry.normalizedName, {
      cardName: entry.cardName,
      quantity: (current?.quantity ?? 0) + entry.quantity,
    });
  }

  for (const [normalizedName, group] of quantityByName) {
    if (!isBasicEnergyName(catalogByName, normalizedName) && group.quantity > 4) {
      warnings.push({
        ruleId: "COPY_LIMIT",
        severity: "warning",
        message: `More than 4 copies of ${group.cardName} (${group.quantity})`,
        cardNames: [group.cardName],
      });
    }
  }

  const hasBasicPokemonInDeck = [...quantityByName.keys()].some((normalizedName) =>
    hasBasicPokemon(catalogByName, normalizedName),
  );
  if (!hasBasicPokemonInDeck) {
    warnings.push({
      ruleId: "BASIC_POKEMON",
      severity: "warning",
      message: "No Basic Pokémon in deck",
    });
  }

  if (stats.aceSpecCount > 1) {
    warnings.push({
      ruleId: "ACE_SPEC_LIMIT",
      severity: "warning",
      message: `More than 1 ACE SPEC card (${stats.aceSpecCount})`,
    });
  }

  for (const [normalizedName, group] of quantityByName) {
    const meta = pickMeta(catalogByName, normalizedName);
    if (!meta) {
      warnings.push({
        ruleId: "CARD_NOT_FOUND",
        severity: "warning",
        message: `${group.cardName} not found in catalog`,
        cardNames: [group.cardName],
      });
      continue;
    }

    if (!isNameStandardLegal(catalogByName, normalizedName)) {
      warnings.push({
        ruleId: "STANDARD_LEGAL",
        severity: "warning",
        message: `${group.cardName} is not legal in Standard`,
        cardNames: [group.cardName],
      });
    }
  }

  return {
    warnings,
    isValid: warnings.length === 0,
    stats,
  };
}

export function pickRepresentativeCard(
  catalogByName: Map<string, CatalogCardMeta[]>,
  normalizedName: string,
): CatalogCardMeta | null {
  return pickMeta(catalogByName, normalizedName);
}
