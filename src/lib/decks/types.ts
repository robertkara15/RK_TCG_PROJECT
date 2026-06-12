export type DeckCardEntry = {
  cardName: string;
  normalizedName: string;
  quantity: number;
  representativeCardId?: string | null;
};

export type CatalogCardMeta = {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  stage: string | null;
  trainerType: string | null;
  energyType: string | null;
  nameIsStandardLegal: boolean;
  isAceSpec: boolean;
  isBasicEnergy: boolean;
  imageUrl: string | null;
  localId: string;
  setReleaseDate: string | null;
};

export type DeckStats = {
  totalCards: number;
  pokemon: number;
  trainer: number;
  energy: number;
  trainers: {
    supporter: number;
    item: number;
    stadium: number;
    tool: number;
    other: number;
  };
  pokemonBreakdown: {
    basic: number;
    stage1: number;
    stage2: number;
    other: number;
  };
  energyBreakdown: {
    basic: number;
    special: number;
  };
  aceSpecCount: number;
};

export type ValidationWarning = {
  ruleId: string;
  severity: "warning";
  message: string;
  cardNames?: string[];
};

export type ValidationResult = {
  warnings: ValidationWarning[];
  isValid: boolean;
  stats: DeckStats;
};

export const EMPTY_DECK_STATS: DeckStats = {
  totalCards: 0,
  pokemon: 0,
  trainer: 0,
  energy: 0,
  trainers: {
    supporter: 0,
    item: 0,
    stadium: 0,
    tool: 0,
    other: 0,
  },
  pokemonBreakdown: {
    basic: 0,
    stage1: 0,
    stage2: 0,
    other: 0,
  },
  energyBreakdown: {
    basic: 0,
    special: 0,
  },
  aceSpecCount: 0,
};
