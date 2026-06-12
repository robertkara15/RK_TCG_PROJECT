# Glossary

Terms used throughout the RK_TCG_PROJECT specification.

## Card catalog terms

| Term | Definition |
|------|------------|
| **Catalog** | Read-only reference data synced from TCGdex. Shared across all users (single user in practice). |
| **Card** | A specific print of a card, identified by TCGdex `id` (e.g. `sv03-185`). |
| **Card name** | The official name on the card (e.g. `Ultra Ball`). Copy limits and name-level legality use this field. |
| **Print** | A specific catalog card — one set + number + art combination. |
| **Regulation mark** | Letter in the bottom-left of modern cards (H, I, J, etc.). Determines print-level Standard legality. |
| **Category** | TCGdex `category`: `Pokemon`, `Trainer`, or `Energy`. |
| **Trainer type** | TCGdex `trainerType` on Trainer cards: `Item`, `Supporter`, `Stadium`, `Tool`, etc. |
| **Energy type** | TCGdex `energyType`: `Basic` or `Special`. |
| **Stage** | Pokémon evolution stage: `Basic`, `Stage1`, `Stage2`, etc. |
| **Set** | An expansion (e.g. `Paldea Evolved`). Has official and total card counts. |
| **Official card count** | `set.cardCount.official` — cards numbered in the main set (used for set completion). |

## Legality terms

| Term | Definition |
|------|------------|
| **Standard** | The rotating competitive format. This app supports Standard only. |
| **Print-level legality** | Whether a specific print's regulation mark is legal (`legal.standard` from TCGdex, or computed). |
| **Name-level legality** | Tournament rule: a card **name** is Standard-legal if **any** English print of that name is legal in Standard. |
| **Reprint rule** | Older art of a legal card name may be played if any H/I/J (or future) print of that name exists. |
| **Legal marks (2026)** | `H`, `I`, `J`, and any marks released after `J`. |
| **ACE SPEC** | Powerful cards restricted to **max 1 per deck** (any ACE SPEC). Present in current Standard (SV era). |

## User data terms

| Term | Definition |
|------|------------|
| **Collection** | Cards the owner possesses, tracked per print with quantity. |
| **Album** | A named grouping of catalog cards. May include cards **not** in the collection (binder goals). |
| **Binder page** | One page in an album showing a 3×3 grid (9 slots). |
| **Deck** | A saved 60-card (target) list tracked by card name + quantity. |
| **Folder** | Organizational container for decks. |
| **Tag** | Label attached to a deck (many-to-many). |
| **Soft warning** | Validation issue shown to the user but does not prevent saving. |

## Excluded terms (not used in this project)

| Term | Note |
|------|------|
| **Radiant Pokémon** | SWSH-era mechanic. Not in 2026 Standard. No deck validation. |
| **Prism Star (◆)** | SM-era mechanic. Not in 2026 Standard. No deck validation. |
| **Pricing** | Market values. Never stored or displayed. |

## Format abbreviations

| Abbrev | Meaning |
|--------|---------|
| PTCGL | Pokémon TCG Live |
| TCGdex | Card data API at [tcgdex.dev](https://tcgdex.dev) |
| EN | English language cards |
