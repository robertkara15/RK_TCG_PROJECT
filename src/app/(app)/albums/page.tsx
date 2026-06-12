import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Albums — RK TCG",
};

export default function AlbumsPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-white">Albums</h1>
      <p className="text-zinc-400">Binder-style albums arrive in milestone M4.</p>
    </div>
  );
}
