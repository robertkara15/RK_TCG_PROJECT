"use client";

import Image from "next/image";
import { useState } from "react";

import { cardImageUrl } from "@/lib/catalog/images";

export function CardImage({
  imageUrl,
  name,
  quality = "low",
  className = "",
  priority = false,
}: {
  imageUrl: string | null | undefined;
  name: string;
  quality?: "high" | "low";
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = cardImageUrl(imageUrl, quality);

  if (!src || failed) {
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 rounded-lg bg-zinc-800 px-2 text-center text-sm font-semibold text-zinc-400 ${className}`}
      >
        <span>{initials}</span>
        {!src ? null : (
          <span className="text-[10px] font-normal text-zinc-500">No image</span>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={quality === "high" ? 360 : 180}
      height={quality === "high" ? 504 : 252}
      className={`rounded-lg object-contain ${className}`}
      loading={priority ? "eager" : "lazy"}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
