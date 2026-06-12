import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in — RK TCG",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
            RK TCG
          </p>
          <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          <p className="text-sm text-zinc-400">Personal Standard organizer</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
