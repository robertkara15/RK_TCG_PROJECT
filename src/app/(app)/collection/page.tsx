import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collection — RK TCG",
};

export default function CollectionPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-white">Collection</h1>
      <p className="text-zinc-400">Track owned prints per card in milestone M2.</p>
    </div>
  );
}
