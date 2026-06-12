"use client";

import {
  COLLECTION_SORT_GROUP,
  SORT_GROUPS,
  type SortOption,
} from "@/lib/catalog/filter-sort";

export function CatalogSort({
  value,
  onChange,
  includeCollectionSort = false,
}: {
  value: SortOption;
  onChange: (sort: SortOption) => void;
  includeCollectionSort?: boolean;
}) {
  const groups = includeCollectionSort
    ? [...SORT_GROUPS, COLLECTION_SORT_GROUP]
    : SORT_GROUPS;

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-300">
      <span className="text-zinc-500">Sort</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
      >
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
