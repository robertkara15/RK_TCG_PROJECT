type PokemonPrintFields = {
  hp: number | null;
  stage: string | null;
  evolveFrom: string | null;
  types: unknown;
  attacks: unknown;
  abilities: unknown;
  retreat: number | null;
  weaknesses: unknown;
  resistances: unknown;
};

type NamedEffect = {
  name?: string;
  effect?: string;
  damage?: string | number;
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeTypes(types: unknown): string {
  if (!Array.isArray(types)) {
    return "";
  }

  return types
    .map((type) => String(type).trim().toLowerCase())
    .sort()
    .join("|");
}

function normalizeNamedEffects(
  entries: unknown,
  includeDamage = false,
): string {
  if (!Array.isArray(entries) || entries.length === 0) {
    return "";
  }

  const normalized = entries
    .map((entry) => {
      const item = entry as NamedEffect;
      const base = {
        name: normalizeText(item.name),
        effect: normalizeText(item.effect),
      };

      return includeDamage
        ? {
            ...base,
            damage: String(item.damage ?? "").trim(),
          }
        : base;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return JSON.stringify(normalized);
}

function normalizeStatBlock(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) {
    return "";
  }

  return JSON.stringify(
    value
      .map((entry) => {
        const item = entry as { type?: string; value?: string };
        return {
          type: normalizeText(item.type),
          value: normalizeText(item.value),
        };
      })
      .sort((a, b) => `${a.type}:${a.value}`.localeCompare(`${b.type}:${b.value}`)),
  );
}

function evolveFromMatches(
  source: string | null | undefined,
  candidate: string | null | undefined,
): boolean {
  const normalizedSource = normalizeText(source);
  const normalizedCandidate = normalizeText(candidate);

  if (!normalizedSource || !normalizedCandidate) {
    return true;
  }

  return normalizedSource === normalizedCandidate;
}

export function pokemonGameplayFingerprint(card: PokemonPrintFields): string {
  return JSON.stringify({
    hp: card.hp ?? null,
    stage: normalizeText(card.stage),
    types: normalizeTypes(card.types),
    retreat: card.retreat ?? null,
    attacks: normalizeNamedEffects(card.attacks, true),
    abilities: normalizeNamedEffects(card.abilities),
    weaknesses: normalizeStatBlock(card.weaknesses),
    resistances: normalizeStatBlock(card.resistances),
  });
}

export function isSamePokemonPrint(
  source: PokemonPrintFields,
  candidate: PokemonPrintFields,
): boolean {
  return (
    pokemonGameplayFingerprint(source) === pokemonGameplayFingerprint(candidate) &&
    evolveFromMatches(source.evolveFrom, candidate.evolveFrom)
  );
}
