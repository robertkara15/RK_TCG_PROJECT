# RK_TCG_PROJECT Specification

Spec-driven development docs for the Pokémon TCG Standard organizer.

## Quick reference

| Decision | Value |
|----------|-------|
| App name | RK_TCG_PROJECT |
| Format | Standard only (H/I/J+) |
| Card API | [TCGdex](https://tcgdex.dev) English |
| Pricing | **Never** |
| Deck tracking | Card name + quantity |
| Collection | Per print + quantity |
| Validation | Soft warnings only |
| Auth | Email/password, single user |
| Deploy | Vercel + Neon Postgres |
| UI | Dark mode, responsive |

## Document order

Read in sequence for full context:

1. [01-overview.md](./01-overview.md) — Goals, stack, constraints
2. [02-glossary.md](./02-glossary.md) — Terms
3. [03-card-catalog.md](./03-card-catalog.md) — TCGdex sync
4. [04-standard-rules.md](./04-standard-rules.md) — Validation rules
5. [05-decks.md](./05-decks.md) — Deck features
6. [06-collections.md](./06-collections.md) — Collection & albums
7. [07-card-detail.md](./07-card-detail.md) — Detail view
8. [08-data-model.md](./08-data-model.md) — Database schema
9. [09-api.md](./09-api.md) — API contracts
10. [10-milestones.md](./10-milestones.md) — Build phases

## Test fixtures

JSON fixtures in [fixtures/](./fixtures/) for unit testing `validateDeck()`:

| File | Tests |
|------|-------|
| `legal-deck.json` | Clean 60-card deck |
| `illegal-ace-spec.json` | ACE SPEC limit warning |
| `reprint-boss-orders.json` | Name-level reprint legality |
| `copy-limit-basic-energy.json` | Basic Energy exempt from 4-copy rule |

## Implementation

Start with [10-milestones.md](./10-milestones.md) milestone **M0**.
