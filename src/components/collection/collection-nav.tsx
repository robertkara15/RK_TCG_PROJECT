"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/collection", label: "My cards", match: (path: string) => path === "/collection" },
  {
    href: "/collection/sets",
    label: "Set progress",
    match: (path: string) => path.startsWith("/collection/sets"),
  },
];

export function CollectionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/40 p-1">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-violet-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
