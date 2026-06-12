# RK_TCG_PROJECT

Personal Pokémon TCG **Standard** organizer — decklists, collection tracking, albums, and card browsing.

## Status

**M1 in progress** — M0 auth scaffold is done; card catalog sync, browse, and detail views are implemented. See [`spec/10-milestones.md`](./spec/10-milestones.md) for the full build plan.

## Features (planned)

- Browse and search all English Pokémon TCG cards (via [TCGdex](https://tcgdex.dev))
- Build Standard decklists with composition stats and soft legality warnings
- Track collection per print with set completion progress
- Albums with 3×3 binder-style pages (owned and wishlist cards)
- PTCGL deck import/export
- Single-user auth, synced across devices (Vercel + Neon)

## Stack (planned)

- Next.js (App Router) + TypeScript + Tailwind
- Neon Postgres + Drizzle
- Auth.js (email/password)
- Deployed on Vercel

## Documentation

Start with [`spec/README.md`](./spec/README.md) for the spec index and [`spec/10-milestones.md`](./spec/10-milestones.md) for the build plan.

## Local setup

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, OWNER_EMAIL, OWNER_PASSWORD
npm install
npm run db:push   # or npm run db:migrate after generating migrations
npm run dev
```

On first server start, the owner account is bootstrapped from `OWNER_EMAIL` and `OWNER_PASSWORD` when the `users` table is empty.

## License

Private personal project. Code is public for portfolio purposes; app data stays in the database, not in this repo.
