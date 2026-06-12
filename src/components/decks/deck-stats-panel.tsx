import type { DeckStats, ValidationWarning } from "@/lib/decks/types";

const STAT_THEMES = {
  pokemon: {
    label: "text-white/70",
    value: "text-white",
  },
  trainer: {
    label: "text-zinc-400",
    value: "text-white",
  },
  energy: {
    label: "text-white/70",
    value: "text-white",
  },
  aceSpec: {
    label: "text-pink-400",
    value: "text-pink-300",
  },
} as const;

const TRAINER_SUBTYPE_THEMES = {
  supporter: "text-red-400",
  item: "text-blue-400",
  stadium: "text-green-400",
  tool: "text-purple-400",
  other: "text-zinc-400",
} as const;

function StatItem({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: keyof typeof STAT_THEMES;
}) {
  const colors = STAT_THEMES[theme];

  return (
    <div className="text-sm">
      <span className={colors.label}>{label}</span>{" "}
      <span className={`font-medium ${colors.value}`}>{value}</span>
    </div>
  );
}

function TrainerBreakdown({ stats }: { stats: DeckStats }) {
  const items: { key: keyof typeof TRAINER_SUBTYPE_THEMES; label: string; value: number }[] =
    [
      { key: "supporter", label: "Supporter", value: stats.trainers.supporter },
      { key: "item", label: "Item", value: stats.trainers.item },
      { key: "stadium", label: "Stadium", value: stats.trainers.stadium },
      { key: "tool", label: "Tool", value: stats.trainers.tool },
      { key: "other", label: "Other", value: stats.trainers.other },
    ].filter((entry) => entry.value > 0);

  if (items.length === 0) {
    return null;
  }

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs">
      {items.map((entry, index) => (
        <span key={entry.key} className="inline-flex items-center gap-x-1.5">
          {index > 0 ? <span className="text-zinc-600">·</span> : null}
          <span className={TRAINER_SUBTYPE_THEMES[entry.key]}>
            {entry.label} {entry.value}
          </span>
        </span>
      ))}
    </p>
  );
}

export function DeckStatsPanel({
  stats,
  warnings,
}: {
  stats: DeckStats;
  warnings: ValidationWarning[];
}) {
  const countClassName =
    stats.totalCards === 60
      ? "text-emerald-400"
      : stats.totalCards > 60
        ? "text-red-400"
        : "text-amber-300";

  return (
    <aside className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Stats
          </h2>
          <p className={`text-2xl font-semibold leading-none ${countClassName}`}>
            {stats.totalCards}/60
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <StatItem label="Pokémon" value={stats.pokemon} theme="pokemon" />
          <StatItem label="Trainer" value={stats.trainer} theme="trainer" />
          <StatItem label="Energy" value={stats.energy} theme="energy" />
          {stats.aceSpecCount > 0 ? (
            <StatItem
              label="ACE SPEC"
              value={stats.aceSpecCount}
              theme="aceSpec"
            />
          ) : null}
        </div>
      </div>

      <TrainerBreakdown stats={stats} />

      <div className="mt-3 border-t border-zinc-800 pt-3">
        {warnings.length > 0 ? (
          <div className="space-y-1">
            <h3 className="text-xs font-medium uppercase tracking-wide text-amber-400">
              Warnings
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-amber-100/90">
              {warnings.map((warning) => (
                <li key={`${warning.ruleId}-${warning.message}`}>
                  • {warning.message}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-emerald-400">No validation warnings</p>
        )}
      </div>
    </aside>
  );
}
