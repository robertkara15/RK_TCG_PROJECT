import Link from "next/link";
import { signOut } from "@/auth";

const navItems = [
  { href: "/cards", label: "Cards" },
  { href: "/collection", label: "Collection" },
  { href: "/decks", label: "Decks" },
  { href: "/albums", label: "Albums" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string | null;
}) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              RK TCG
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-zinc-400 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {email ? <span className="hidden text-zinc-400 sm:inline">{email}</span> : null}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-zinc-900 px-4 py-2 text-sm text-zinc-400 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 whitespace-nowrap transition hover:bg-zinc-900 hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
