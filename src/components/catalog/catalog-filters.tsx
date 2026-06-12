"use client";

import type { CardFilterParams } from "@/lib/catalog/filter-sort";

export type CatalogFacets = {
  sets: { id: string; name: string }[];
  rarities: string[];
  stages: string[];
  energyTypes: string[];
  illustrators: string[];
  regulationMarks: string[];
};

type FilterSectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function FilterSection({ title, children, defaultOpen = false }: FilterSectionProps) {
  return (
    <details
      className="group rounded-lg border border-zinc-800 bg-zinc-900/40"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-200 marker:content-none">
        <span className="flex items-center justify-between">
          {title}
          <span className="text-zinc-500 transition group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-zinc-800 px-4 py-3">{children}</div>
    </details>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-zinc-500">{children}</label>;
}

const selectClassName =
  "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

const inputClassName =
  "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

export function CatalogFilters({
  filters,
  facets,
  onChange,
  onClear,
  activeCount,
}: {
  filters: CardFilterParams;
  facets: CatalogFacets | null;
  onChange: (patch: Partial<CardFilterParams>) => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Filters</h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-violet-400 hover:text-violet-300"
          >
            Clear all ({activeCount})
          </button>
        ) : null}
      </div>

      <FilterSection title="Card text" defaultOpen>
        <div>
          <FieldLabel>Card text</FieldLabel>
          <input
            type="search"
            value={filters.text ?? ""}
            onChange={(event) => onChange({ text: event.target.value || undefined })}
            placeholder="Attack, ability, effect…"
            className={inputClassName}
          />
        </div>
        <div>
          <FieldLabel>Illustrator</FieldLabel>
          <input
            list="illustrator-options"
            value={filters.illustrator ?? ""}
            onChange={(event) =>
              onChange({ illustrator: event.target.value || undefined })
            }
            placeholder="Artist name"
            className={inputClassName}
          />
          <datalist id="illustrator-options">
            {facets?.illustrators.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </FilterSection>

      <FilterSection title="Card details">
        <div>
          <FieldLabel>Expansion</FieldLabel>
          <select
            value={filters.set ?? ""}
            onChange={(event) => onChange({ set: event.target.value || undefined })}
            className={selectClassName}
          >
            <option value="">All expansions</option>
            {facets?.sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Card variant</FieldLabel>
          <select
            value={filters.variant ?? ""}
            onChange={(event) =>
              onChange({
                variant:
                  (event.target.value as CardFilterParams["variant"]) || undefined,
              })
            }
            className={selectClassName}
          >
            <option value="">Any variant</option>
            <option value="normal">Normal</option>
            <option value="holo">Holofoil</option>
            <option value="reverse">Reverse holo</option>
            <option value="firstEdition">First edition</option>
          </select>
        </div>

        <div>
          <FieldLabel>Card type</FieldLabel>
          <select
            value={filters.category ?? ""}
            onChange={(event) =>
              onChange({ category: event.target.value || undefined })
            }
            className={selectClassName}
          >
            <option value="">All types</option>
            <option value="Pokemon">Pokémon</option>
            <option value="Trainer">Trainer</option>
            <option value="Energy">Energy</option>
          </select>
        </div>

        <div>
          <FieldLabel>Rarity</FieldLabel>
          <select
            value={filters.rarity ?? ""}
            onChange={(event) =>
              onChange({ rarity: event.target.value || undefined })
            }
            className={selectClassName}
          >
            <option value="">All rarities</option>
            {facets?.rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Energy type</FieldLabel>
          <select
            value={filters.energyType ?? ""}
            onChange={(event) =>
              onChange({ energyType: event.target.value || undefined })
            }
            className={selectClassName}
          >
            <option value="">All energy types</option>
            {facets?.energyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Pokémon stage</FieldLabel>
          <select
            value={filters.stage ?? ""}
            onChange={(event) => onChange({ stage: event.target.value || undefined })}
            className={selectClassName}
          >
            <option value="">All stages</option>
            {facets?.stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Min HP</FieldLabel>
            <input
              type="number"
              min={0}
              value={filters.hpMin ?? ""}
              onChange={(event) =>
                onChange({
                  hpMin: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              className={inputClassName}
            />
          </div>
          <div>
            <FieldLabel>Max HP</FieldLabel>
            <input
              type="number"
              min={0}
              value={filters.hpMax ?? ""}
              onChange={(event) =>
                onChange({
                  hpMax: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Regulation mark</FieldLabel>
          <select
            value={filters.regulationMark ?? ""}
            onChange={(event) =>
              onChange({ regulationMark: event.target.value || undefined })
            }
            className={selectClassName}
          >
            <option value="">Any mark</option>
            {facets?.regulationMarks.map((mark) => (
              <option key={mark} value={mark}>
                {mark}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={filters.standardLegal === true}
            onChange={(event) =>
              onChange({ standardLegal: event.target.checked || undefined })
            }
            className="rounded border-zinc-600 bg-zinc-900"
          />
          Standard legal only
        </label>
      </FilterSection>
    </div>
  );
}
