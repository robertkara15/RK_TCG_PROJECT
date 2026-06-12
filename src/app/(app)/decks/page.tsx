import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decks — RK TCG",
};

export default function DecksPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-white">Decks</h1>
      <p className="text-zinc-400">Build Standard decklists in milestone M3.</p>
    </div>
  );
}
