export type TcgdexSetBrief = {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: {
    official?: number;
    total?: number;
  };
};

export type TcgdexSetDetail = TcgdexSetBrief & {
  releaseDate?: string;
  serie?: {
    id: string;
    name?: string;
  };
};

export type TcgdexCardBrief = {
  id: string;
  localId: string;
  name: string;
  image?: string;
};

export type TcgdexCardDetail = {
  id: string;
  localId: string;
  name: string;
  image?: string;
  category: string;
  rarity?: string;
  illustrator?: string;
  regulationMark?: string;
  legal?: {
    standard?: boolean;
    expanded?: boolean;
  };
  updated?: string;
  variants?: Record<string, boolean>;
  effect?: string;
  trainerType?: string;
  energyType?: string;
  hp?: number;
  types?: string[];
  stage?: string;
  evolveFrom?: string;
  dexId?: number[];
  attacks?: unknown[];
  abilities?: unknown[];
  weaknesses?: unknown[];
  resistances?: unknown[];
  retreat?: number;
  description?: string;
  set?: {
    id: string;
    name?: string;
  };
  pricing?: unknown;
};
