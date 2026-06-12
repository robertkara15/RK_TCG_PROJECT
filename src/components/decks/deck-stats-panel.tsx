import type { DeckStats, ValidationWarning } from "@/lib/decks/types";

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
    <aside className="z-0 space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 xl:sticky xl:top-4 xl:self-start">
      <div className="space-y-1">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Stats
        </h2>
        <p className={`text-2xl font-semibold ${countClassName}`}>
          {stats.totalCards}/60
        </p>
      </div>

      <div className="space-y-2 text-sm text-zinc-300">
        <p>Pokémon {stats.pokemon}</p>
        <p>Trainer {stats.trainer}</p>
        <div className="space-y-1 pl-3 text-zinc-400">
          <p>Supporter {stats.trainers.supporter}</p>
          <p>Item {stats.trainers.item}</p>
          <p>Stadium {stats.trainers.stadium}</p>
          {stats.trainers.tool > 0 ? <p>Tool {stats.trainers.tool}</p> : null}
        </div>
        <p>Energy {stats.energy}</p>
        {stats.aceSpecCount > 0 ? (
          <p className="text-amber-300">ACE SPEC {stats.aceSpecCount}</p>
        ) : null}
      </div>

      {warnings.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium uppercase tracking-wide text-amber-400">
            Warnings
          </h3>
          <ul className="space-y-2 text-sm text-amber-100/90">
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
    </aside>
  );
}
