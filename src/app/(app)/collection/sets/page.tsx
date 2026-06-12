import type { Metadata } from "next";

import { SetProgressList } from "@/components/collection/set-progress-list";

export const metadata: Metadata = {
  title: "Set progress — RK TCG",
};

export default function CollectionSetsPage() {
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Set progress</h1>
        <p className="text-sm text-zinc-400">
          Track how complete each expansion is based on official card counts.
        </p>
      </div>

      <SetProgressList />
    </>
  );
}
