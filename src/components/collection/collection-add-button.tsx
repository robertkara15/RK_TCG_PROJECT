"use client";

import { useState } from "react";

export function CollectionAddButton({
  cardId,
  onAdded,
}: {
  cardId: string;
  onAdded?: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, quantity: 1 }),
      });

      if (!response.ok) {
        throw new Error("Failed to add card");
      }

      setAdded(true);
      onAdded?.();
    } finally {
      setIsSaving(false);
    }
  }

  if (added) {
    return (
      <span className="text-sm font-medium text-emerald-400">Added</span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleAdd()}
      disabled={isSaving}
      className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
    >
      {isSaving ? "Adding…" : "Add"}
    </button>
  );
}
