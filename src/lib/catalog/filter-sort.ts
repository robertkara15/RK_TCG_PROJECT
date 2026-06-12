import { asc, desc, sql, type SQL } from "drizzle-orm";

import { cards, collectionEntries, sets } from "@/lib/db/schema";

export type CardFilterParams = {
  q?: string;
  text?: string;
  illustrator?: string;
  set?: string;
  category?: string;
  rarity?: string;
  energyType?: string;
  stage?: string;
  hpMin?: number;
  hpMax?: number;
  regulationMark?: string;
  standardLegal?: boolean;
  variant?: "normal" | "holo" | "reverse" | "firstEdition";
};

export type SortOption =
  | "number"
  | "name_asc"
  | "name_desc"
  | "rarity_asc"
  | "rarity_desc"
  | "dex_asc"
  | "dex_desc"
  | "release_new"
  | "release_old"
  | "quantity_asc"
  | "quantity_desc"
  | "added_new"
  | "added_old";

export const SORT_GROUPS: {
  label: string;
  options: { value: SortOption; label: string }[];
}[] = [
  {
    label: "Sort cards by",
    options: [
      { value: "number", label: "Card number" },
      { value: "name_asc", label: "Card name (A–Z)" },
      { value: "name_desc", label: "Card name (Z–A)" },
      { value: "rarity_desc", label: "Rarity (high to low)" },
      { value: "rarity_asc", label: "Rarity (low to high)" },
      { value: "dex_asc", label: "Pokédex number" },
    ],
  },
  {
    label: "Release date order",
    options: [
      { value: "release_new", label: "New to old" },
      { value: "release_old", label: "Old to new" },
    ],
  },
];

export const COLLECTION_SORT_GROUP = {
  label: "Collection",
  options: [
    { value: "quantity_desc" as const, label: "Quantity (high to low)" },
    { value: "quantity_asc" as const, label: "Quantity (low to high)" },
    { value: "added_new" as const, label: "Recently added" },
    { value: "added_old" as const, label: "Oldest added" },
  ],
};

const RARITY_RANK_SQL = sql`
  CASE ${cards.rarity}
    WHEN 'Common' THEN 1
    WHEN 'Uncommon' THEN 2
    WHEN 'Rare' THEN 3
    WHEN 'Double Rare' THEN 4
    WHEN 'Ultra Rare' THEN 5
    WHEN 'Illustration Rare' THEN 6
    WHEN 'Special Illustration Rare' THEN 7
    WHEN 'Hyper Rare' THEN 8
    WHEN 'ACE SPEC Rare' THEN 9
    WHEN 'Shiny Rare' THEN 10
    WHEN 'Shiny Ultra Rare' THEN 11
    WHEN 'Promo' THEN 12
    WHEN 'None' THEN 13
    ELSE 50
  END
`;

const LOCAL_ID_NUMERIC_SQL = sql`
  CASE
    WHEN ${cards.localId} ~ '^[0-9]+$' THEN ${cards.localId}::int
    ELSE 999999
  END
`;

const DEX_NUMBER_SQL = sql`COALESCE((${cards.dexIds}->>0)::int, 999999)`;

export function parseSortOption(value: string | null | undefined): SortOption {
  const allowed: SortOption[] = [
    "number",
    "name_asc",
    "name_desc",
    "rarity_asc",
    "rarity_desc",
    "dex_asc",
    "dex_desc",
    "release_new",
    "release_old",
    "quantity_asc",
    "quantity_desc",
    "added_new",
    "added_old",
  ];

  if (value && allowed.includes(value as SortOption)) {
    return value as SortOption;
  }

  return "name_asc";
}

export function buildCardFilterSql(params: CardFilterParams): SQL[] {
  const filters: SQL[] = [];

  if (params.q) {
    filters.push(
      sql`${cards.normalizedName} ILIKE ${`%${params.q.trim().toLowerCase()}%`}`,
    );
  }

  if (params.text) {
    const pattern = `%${params.text.trim()}%`;
    filters.push(sql`(
      ${cards.effect} ILIKE ${pattern}
      OR ${cards.description} ILIKE ${pattern}
      OR ${cards.attacks}::text ILIKE ${pattern}
      OR ${cards.abilities}::text ILIKE ${pattern}
    )`);
  }

  if (params.illustrator) {
    filters.push(sql`${cards.illustrator} ILIKE ${`%${params.illustrator.trim()}%`}`);
  }

  if (params.set) {
    filters.push(sql`${cards.setId} = ${params.set}`);
  }

  if (params.category) {
    filters.push(sql`${cards.category} = ${params.category}`);
  }

  if (params.rarity) {
    filters.push(sql`${cards.rarity} = ${params.rarity}`);
  }

  if (params.energyType) {
    filters.push(sql`${cards.energyType} = ${params.energyType}`);
  }

  if (params.stage) {
    filters.push(sql`${cards.stage} = ${params.stage}`);
  }

  if (params.hpMin != null) {
    filters.push(sql`${cards.hp} >= ${params.hpMin}`);
  }

  if (params.hpMax != null) {
    filters.push(sql`${cards.hp} <= ${params.hpMax}`);
  }

  if (params.regulationMark) {
    filters.push(sql`${cards.regulationMark} = ${params.regulationMark}`);
  }

  if (params.standardLegal === true) {
    filters.push(sql`${cards.nameIsStandardLegal} = true`);
  }

  if (params.variant === "normal") {
    filters.push(sql`(${cards.variants}->>'normal')::boolean = true`);
  }

  if (params.variant === "holo") {
    filters.push(sql`(${cards.variants}->>'holo')::boolean = true`);
  }

  if (params.variant === "reverse") {
    filters.push(sql`(${cards.variants}->>'reverse')::boolean = true`);
  }

  if (params.variant === "firstEdition") {
    filters.push(sql`(${cards.variants}->>'firstEdition')::boolean = true`);
  }

  return filters;
}

export function buildCardOrderBy(sort: SortOption): SQL[] {
  switch (sort) {
    case "number":
      return [asc(LOCAL_ID_NUMERIC_SQL), asc(cards.name)];
    case "name_desc":
      return [desc(cards.name), asc(cards.localId)];
    case "rarity_desc":
      return [desc(RARITY_RANK_SQL), asc(cards.name)];
    case "rarity_asc":
      return [asc(RARITY_RANK_SQL), asc(cards.name)];
    case "dex_asc":
      return [asc(DEX_NUMBER_SQL), asc(cards.name)];
    case "dex_desc":
      return [desc(DEX_NUMBER_SQL), asc(cards.name)];
    case "release_new":
      return [
        sql`${sets.releaseDate} DESC NULLS LAST`,
        asc(LOCAL_ID_NUMERIC_SQL),
        asc(cards.name),
      ];
    case "release_old":
      return [
        sql`${sets.releaseDate} ASC NULLS LAST`,
        asc(LOCAL_ID_NUMERIC_SQL),
        asc(cards.name),
      ];
    case "quantity_desc":
      return [desc(collectionEntries.quantity), asc(cards.name)];
    case "quantity_asc":
      return [asc(collectionEntries.quantity), asc(cards.name)];
    case "added_new":
      return [desc(collectionEntries.updatedAt), asc(cards.name)];
    case "added_old":
      return [asc(collectionEntries.updatedAt), asc(cards.name)];
    case "name_asc":
    default:
      return [asc(cards.name), asc(cards.localId)];
  }
}

export function parseCardFiltersFromSearchParams(
  searchParams: URLSearchParams,
): CardFilterParams {
  const hpMin = searchParams.get("hpMin");
  const hpMax = searchParams.get("hpMax");

  return {
    q: searchParams.get("q") ?? undefined,
    text: searchParams.get("text") ?? undefined,
    illustrator: searchParams.get("illustrator") ?? undefined,
    set: searchParams.get("set") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    rarity: searchParams.get("rarity") ?? undefined,
    energyType: searchParams.get("energyType") ?? undefined,
    stage: searchParams.get("stage") ?? undefined,
    hpMin: hpMin ? Number(hpMin) : undefined,
    hpMax: hpMax ? Number(hpMax) : undefined,
    regulationMark: searchParams.get("regulationMark") ?? undefined,
    standardLegal:
      searchParams.get("standardLegal") === "true" ? true : undefined,
    variant: (searchParams.get("variant") as CardFilterParams["variant"]) ?? undefined,
  };
}
