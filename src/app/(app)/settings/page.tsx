import type { Metadata } from "next";

import { CatalogSync } from "@/components/catalog-sync";

export const metadata: Metadata = {
  title: "Settings — RK TCG",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-zinc-400">
          Manage catalog sync and app preferences.
        </p>
      </div>

      <CatalogSync />
    </div>
  );
}
