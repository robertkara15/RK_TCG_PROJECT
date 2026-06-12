import type { CardFilterParams, SortOption } from "@/lib/catalog/filter-sort";

export type CatalogFilterState = CardFilterParams & {
  sort: SortOption;
};

export const DEFAULT_FILTER_STATE: CatalogFilterState = {
  sort: "name_asc",
};

export function filtersToSearchParams(
  filters: CatalogFilterState,
  page = 1,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("sort", filters.sort);

  if (filters.q) params.set("q", filters.q);
  if (filters.text) params.set("text", filters.text);
  if (filters.illustrator) params.set("illustrator", filters.illustrator);
  if (filters.set) params.set("set", filters.set);
  if (filters.category) params.set("category", filters.category);
  if (filters.rarity) params.set("rarity", filters.rarity);
  if (filters.energyType) params.set("energyType", filters.energyType);
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.hpMin != null) params.set("hpMin", String(filters.hpMin));
  if (filters.hpMax != null) params.set("hpMax", String(filters.hpMax));
  if (filters.regulationMark) params.set("regulationMark", filters.regulationMark);
  if (filters.standardLegal) params.set("standardLegal", "true");
  if (filters.variant) params.set("variant", filters.variant);

  return params;
}

export function countActiveFilters(filters: CatalogFilterState): number {
  let count = 0;
  if (filters.q) count += 1;
  if (filters.text) count += 1;
  if (filters.illustrator) count += 1;
  if (filters.set) count += 1;
  if (filters.category) count += 1;
  if (filters.rarity) count += 1;
  if (filters.energyType) count += 1;
  if (filters.stage) count += 1;
  if (filters.hpMin != null || filters.hpMax != null) count += 1;
  if (filters.regulationMark) count += 1;
  if (filters.standardLegal) count += 1;
  if (filters.variant) count += 1;
  return count;
}
