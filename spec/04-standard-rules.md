# Standard Rules & Deck Validation

This document defines machine-readable rules for 2026 Standard format. Validation is **soft** — issues are warnings only; decks always save.

## Format definition

| Property | Value |
|----------|-------|
| Format | Standard |
| Legal regulation marks | `H`, `I`, `J`, and any mark alphabetically after `J` |
| Illegal marks (2026 rotation) | `G` and all prior |
| Rotation effective (in-person) | 2026-04-10 |
| Rotation effective (PTCGL) | 2026-03-26 |
| Reprint rule | **Enabled** — name-level legality |

## Regulation mark config

Stored in `format_config` table (singleton row):

```json
{
  "format": "standard",
  "legal_marks": ["H", "I", "J"],
  "accept_future_marks": true,
  "rotation_effective_date": "2026-04-10"
}
```

When `accept_future_marks` is true, any mark > `J` alphabetically is also legal.

### Updating on rotation

1. Prefer TCGdex `legal.standard` on sync (auto from API).
2. Admin can update `legal_marks` in config if API lags.
3. Recompute `name_is_standard_legal` for all cards after config change.

## Legality logic

### Print-level legality

```typescript
function isPrintStandardLegal(card: CatalogCard, config: FormatConfig): boolean {
  if (card.legal_standard_print != null) {
    return card.legal_standard_print; // trust TCGdex when present
  }
  // fallback
  if (!card.regulation_mark) return false;
  if (config.accept_future_marks && card.regulation_mark > 'J') return true;
  return config.legal_marks.includes(card.regulation_mark);
}
```

### Name-level legality (tournament reprint rule)

```typescript
function isNameStandardLegal(cardName: string, catalog: CatalogCard[]): boolean {
  return catalog
    .filter(c => c.normalized_name === normalize(cardName))
    .some(c => isPrintStandardLegal(c, config));
}
```

### Deck card legality (name-only decks)

Since decks track **name + quantity**, legality is evaluated at **name level**:

```typescript
function isDeckEntryLegal(entry: DeckEntry): boolean {
  return isNameStandardLegal(entry.card_name, catalog);
}
```

## Deck construction rules

### Rules to validate (v1)

| Rule ID | Rule | Severity | Blocks save? |
|---------|------|----------|--------------|
| `DECK_SIZE` | Deck should contain exactly 60 cards | warning | no |
| `COPY_LIMIT` | Max 4 copies per card name (except Basic Energy) | warning | no |
| `BASIC_POKEMON` | At least 1 Basic Pokémon required | warning | no |
| `ACE_SPEC_LIMIT` | Max 1 ACE SPEC card in deck | warning | no |
| `STANDARD_LEGAL` | Every card name must be Standard-legal (name-level) | warning | no |

### Rules explicitly NOT validated (2026 Standard)

| Rule | Reason |
|------|--------|
| Radiant max 1 | No Radiant cards in 2026 Standard |
| Prism Star max 1 | No Prism Star cards in 2026 Standard |
| Expanded legality | Standard only |

### Rule details

#### DECK_SIZE

```
totalQuantity = sum(deck_cards.quantity)
if totalQuantity !== 60 → warn "Deck has {n}/60 cards"
```

#### COPY_LIMIT

```
Group deck entries by normalized card name.
For each group where NOT is_basic_energy(name):
  if sum(quantity) > 4 → warn "More than 4 copies of {name}"
```

Basic Energy detection: any catalog card with `category = Energy` AND `energy_type = Basic` matching that name. Names like `Fire Energy`, `Basic {Type} Energy`.

#### BASIC_POKEMON

```
At least one deck entry where catalog match has:
  category = 'Pokemon' AND stage = 'Basic'
If none → warn "No Basic Pokémon in deck"
```

If stage is unknown for a Basic Pokémon (e.g. ex without stage field), also accept `stage IS NULL AND category = Pokemon` where name does not imply evolution — fallback: check if any matching print has `stage = 'Basic'`.

#### ACE_SPEC_LIMIT

```
aceSpecCount = sum(quantity) for entries where any catalog print of that name has is_ace_spec = true
if aceSpecCount > 1 → warn "More than 1 ACE SPEC card ({count})"
```

ACE SPEC detection at sync time:
- `rarity` includes `ACE SPEC` (TCGdex English rarity string), OR
- Trainer/Pokemon with rules text containing `ACE SPEC`

#### STANDARD_LEGAL

```
For each unique card name in deck:
  if NOT name_is_standard_legal → warn "{name} is not legal in Standard"
```

## Validation output

```typescript
interface ValidationWarning {
  ruleId: string;
  severity: 'warning'; // only severity in v1
  message: string;
  cardNames?: string[]; // affected cards
}

interface ValidationResult {
  warnings: ValidationWarning[];
  isValid: boolean; // true if warnings.length === 0
  stats: DeckStats; // see 05-decks.md
}
```

`isValid` is informational. **Never prevent save** based on validation.

## Deck stats (computed alongside validation)

```typescript
interface DeckStats {
  totalCards: number;
  pokemon: number;
  trainer: number;
  energy: number;
  trainers: {
    supporter: number;
    item: number;
    stadium: number;
    tool: number;
    other: number;
  };
  pokemonBreakdown: {
    basic: number;
    stage1: number;
    stage2: number;
    other: number;
  };
  energyBreakdown: {
    basic: number;
    special: number;
  };
  aceSpecCount: number;
}
```

Category resolution: look up each deck entry name in catalog. If multiple prints exist, use any matching print for category/subtype (they share name). If no catalog match → count as `unknown` and warn `CARD_NOT_FOUND`.

## Test fixtures

See `fixtures/` directory:

| File | Tests |
|------|-------|
| `legal-deck.json` | 60-card legal Standard deck — no warnings |
| `illegal-ace-spec.json` | 2 ACE SPEC cards — ACE_SPEC_LIMIT warning |
| `reprint-boss-orders.json` | Boss's Orders name legal via reprint — no STANDARD_LEGAL warning |

## Future considerations (not v1)

- Banned card list overlay (mid-season bans)
- New card waiting period warnings (~2 weeks post-release)
- Expanded format toggle
