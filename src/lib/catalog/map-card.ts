import { detectAceSpec, detectBasicEnergy } from "@/lib/catalog/legality";
import { extractSetId, normalizeCardName } from "@/lib/catalog/normalize";
import type { TcgdexCardBrief, TcgdexCardDetail } from "@/lib/tcgdex/types";

export function mapBriefCard(brief: TcgdexCardBrief) {
  const setId = extractSetId(brief.id, brief.localId);

  return {
    id: brief.id,
    name: brief.name,
    normalizedName: normalizeCardName(brief.name),
    category: "Unknown",
    imageUrl: brief.image ?? null,
    localId: brief.localId,
    setId,
    catalogSyncedAt: new Date(),
  };
}

export function mapDetailCard(detail: TcgdexCardDetail) {
  const setId = detail.set?.id ?? extractSetId(detail.id, detail.localId);
  const category = detail.category;
  const effect = detail.effect ?? null;
  const description = detail.description ?? null;

  return {
    id: detail.id,
    name: detail.name,
    normalizedName: normalizeCardName(detail.name),
    category,
    imageUrl: detail.image ?? null,
    localId: detail.localId,
    setId,
    rarity: detail.rarity ?? null,
    illustrator: detail.illustrator ?? null,
    regulationMark: detail.regulationMark ?? null,
    legalStandardPrint: null,
    isAceSpec: detectAceSpec(detail.rarity, effect, description),
    isBasicEnergy: detectBasicEnergy(category, detail.energyType, detail.name),
    hp: detail.hp ?? null,
    types: detail.types ?? null,
    stage: detail.stage ?? null,
    evolveFrom: detail.evolveFrom ?? null,
    dexIds: detail.dexId ?? null,
    attacks: detail.attacks ?? null,
    abilities: detail.abilities ?? null,
    weaknesses: detail.weaknesses ?? null,
    resistances: detail.resistances ?? null,
    retreat: detail.retreat ?? null,
    description,
    trainerType: detail.trainerType ?? null,
    effect,
    energyType: detail.energyType ?? null,
    variants: detail.variants ?? null,
    tcgdexUpdatedAt: detail.updated ? new Date(detail.updated) : null,
    catalogSyncedAt: new Date(),
  };
}
