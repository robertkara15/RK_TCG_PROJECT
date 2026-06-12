import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home — RK TCG",
};

const milestones = [
  { name: "M0", label: "Auth & scaffold", status: "complete" },
  { name: "M1", label: "Card catalog", status: "active" },
  { name: "M2", label: "Collection", status: "upcoming" },
  { name: "M3", label: "Decks", status: "upcoming" },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="max-w-2xl text-zinc-400">
          RK TCG is your personal Pokémon TCG Standard organizer. Sync the
          catalog in Settings, then browse cards. Collection and decks arrive in
          the next milestones.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {milestones.map((milestone) => (
          <div
            key={milestone.name}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <p className="text-sm font-medium text-violet-400">{milestone.name}</p>
            <p className="mt-1 text-lg font-medium text-white">{milestone.label}</p>
            <p className="mt-2 text-sm capitalize text-zinc-500">{milestone.status}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
