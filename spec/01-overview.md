# RK_TCG_PROJECT — Overview

**Version:** 1.0  
**Status:** Draft for implementation  
**Last updated:** 2026-06-12

## Summary

RK_TCG_PROJECT is a personal, single-user web application for organizing Pokémon Trading Card Game **Standard** play. It provides a searchable English card catalog, deck building with composition stats and soft legality warnings, per-print collection tracking, albums with binder-style layouts, and set completion progress.

The app is deployed publicly on **Vercel** with data stored in **Neon Postgres**. Access is restricted to one account via email/password authentication.

## Goals

1. Browse and search every English Pokémon TCG card with rich detail views.
2. Build and save 60-card Standard decklists tracked by **card name + quantity**.
3. See deck composition stats (Pokémon, Trainer subtypes, Energy).
4. Track owned cards **per specific print** with quantities.
5. Organize cards into **albums** (including cards not owned — binder goals).
6. View **set completion** progress per expansion.
7. Import and export decklists in **Pokémon TCG Live (PTCGL)** format.
8. Sync card catalog on demand from **TCGdex** (free API).
9. Sync decks and collection across phone and laptop via cloud database.

## Non-goals

| Item | Reason |
|------|--------|
| Multi-user / social features | Personal use only |
| Expanded format support | Standard only |
| Card pricing or price history | Explicitly excluded |
| Marketplace / trading | Out of scope |
| Deck vs collection gap analysis | Deferred — not wanted |
| Separate wishlist entity | Albums cover wishlist use case |
| Limitless / plain-text export | PTCGL export only |
| Offline-first / local image cache | Online OK; hot-link images |
| Hard deck validation blocking saves | Soft warnings only |
| Radiant / Prism Star deck rules | Not in 2026 Standard |
| Physical card scanning | Out of scope |
| Tournament record tracking | Scope creep |

## Users

| Role | Description |
|------|-------------|
| Owner | Single authenticated user (Robert). Only account with access. |

Public sign-up is **disabled** after the owner account is created. No guest access to user data.

## Technical stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | Neon Postgres |
| ORM | Drizzle (recommended) or Prisma |
| Auth | Auth.js with Credentials provider |
| Hosting | Vercel Hobby (free tier) |
| Card API | [TCGdex](https://tcgdex.dev) — English (`/v2/en/`) |
| Images | Hot-linked from `assets.tcgdex.net` |
| Styling | Tailwind CSS, dark mode default |

## Deployment & repository

| Item | Decision |
|------|----------|
| Code repository | Public GitHub |
| User data | Neon Postgres only — never committed to repo |
| Environment secrets | `DATABASE_URL`, `AUTH_SECRET`, `OWNER_EMAIL` (optional bootstrap) via Vercel env vars |

## Free-tier constraints (design requirements)

- **Lean card catalog schema** — target < 150 MB in Neon (0.5 GB free limit).
- **No pricing data** synced or stored.
- **Chunked catalog sync** — avoid Vercel function timeouts.
- **Hot-linked images** — do not proxy images through Vercel.

## Standard format scope (2026)

- Legal regulation marks: **H, I, J**, and any future marks released after J.
- Rotated out: **G** and all older marks (effective 2026-04-10 in-person; 2026-03-26 PTCGL).
- Legality uses **tournament reprint rule** at the card-name level (see `04-standard-rules.md`).

## Document index

| Doc | Contents |
|-----|----------|
| `02-glossary.md` | Terms and definitions |
| `03-card-catalog.md` | TCGdex sync, schema, update cadence |
| `04-standard-rules.md` | Validation rules and legality logic |
| `05-decks.md` | Deck features, stats, import/export |
| `06-collections.md` | Collection, albums, set completion, binder |
| `07-card-detail.md` | Card detail view specification |
| `08-data-model.md` | Database schema |
| `09-api.md` | Internal API routes and contracts |
| `10-milestones.md` | Phased delivery plan |
| `fixtures/` | Test fixtures for validation logic |

## Success criteria (v1)

- [ ] Owner can log in from phone and laptop; data persists across devices.
- [ ] Catalog sync populates ~22k English cards.
- [ ] Any card is searchable and opens a detail view.
- [ ] Collection supports add/search with per-print quantities.
- [ ] Albums support owned and unowned cards with 3×3 binder pages.
- [ ] Set completion shows owned/official count per expansion.
- [ ] Decks support folders, tags, stats, and soft warnings.
- [ ] PTCGL import (paste + file) and export work for typical decklists.
