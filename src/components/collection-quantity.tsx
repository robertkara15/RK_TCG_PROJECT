"use client";

import { useState } from "react";

export function CollectionQuantity({
  cardId,
  initialQuantity,
}: {
  cardId: string;
  initialQuantity: number;
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isSaving, setIsSaving] = useState(false);

  async function save(nextQuantity: number) {
    setIsSaving(true);
    try {
      const response = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, quantity: nextQuantity }),
      });

      if (!response.ok) {
        throw new Error("Failed to update collection");
      }

      setQuantity(nextQuantity);
    } finally {
      setIsSaving(false);
    }
  }

  function increment() {
    void save(quantity + 1);
  }

  function decrement() {
    void save(Math.max(0, quantity - 1));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-zinc-300">In collection</span>
      <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-900">
        <button
          type="button"
          onClick={decrement}
          disabled={isSaving || quantity === 0}
          className="px-3 py-2 text-zinc-300 transition hover:text-white disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="min-w-8 text-center text-sm font-semibold text-white">
          {quantity}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={isSaving}
          className="px-3 py-2 text-zinc-300 transition hover:text-white disabled:opacity-40"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      {quantity === 0 ? (
        <button
          type="button"
          onClick={increment}
          disabled={isSaving}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          Add to collection
        </button>
      ) : null}
    </div>
  );
}
