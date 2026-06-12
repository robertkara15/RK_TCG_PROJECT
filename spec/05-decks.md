# Decks

## Overview

Decks are 60-card (target) lists tracked by **card name + quantity**. The app does not track which specific print/art is used in a deck.

## User stories

| ID | Story |
|----|-------|
| D-01 | As the owner, I can create a deck with a name. |
| D-02 | As the owner, I can add cards to a deck by searching the catalog. |
| D-03 | As the owner, I can set quantity (1–4) per card name in a deck. |
| D-04 | As the owner, I can view all cards in a deck as a visual grid. |
| D-05 | As the owner, I can click a card to open the detail view. |
| D-06 | As the owner, I can see live deck stats and validation warnings. |
| D-07 | As the owner, I can organize decks into folders. |
| D-08 | As the owner, I can tag decks with multiple tags. |
| D-09 | As the owner, I can import a deck from PTCGL text (paste or file). |
| D-10 | As the owner, I can export a deck to PTCGL format. |
| D-11 | As the owner, I can delete and rename decks. |
| D-12 | As the owner, I can move decks between folders. |

## Deck list view

Route: `/decks`

```
┌─────────────────────────────────────────────────┐
│ Decks                          [+ New Deck]     │
├──────────────┬──────────────────────────────────┤
│ Folders      │  Meta Box (folder)               │
│  ▸ All       │    Charizard ex    60  [H/I/J]   │
│  ▸ Meta      │    Lost Box test   58  ⚠ 2 warns  │
│  ▸ Testing   │                                  │
│  [+ Folder]  │  Tags: [aggro] [WIP]             │
└──────────────┴──────────────────────────────────┘
```

- Sidebar: folder tree. "All" shows every deck.
- Each deck row: name, card count, warning badge if invalid, folder.
- Filter by tag (multi-select).
- Search decks by name.

## Deck editor view

Route: `/decks/[id]`

```
┌──────────────────────────────────────────────────────────┐
│ ← Decks    Charizard ex          [Import] [Export] [⋮] │
├────────────────────────────┬─────────────────────────────┤
│                            │  STATS          58/60  ⚠    │
│  [Search to add card…]     │  Pokémon     18             │
│                            │  Trainer     32             │
│  ┌────┐ ┌────┐ ┌────┐     │    Supporter  12            │
│  │ x4 │ │ x2 │ │ x1 │     │    Item       18            │
│  │    │ │    │ │    │     │    Stadium     2            │
│  └────┘ └────┘ └────┘     │  Energy      10             │
│  (card grid, click=detail) │                             │
│                            │  WARNINGS                   │
│                            │  • Deck has 58/60 cards     │
│                            │  • 5 copies of Ultra Ball   │
└────────────────────────────┴─────────────────────────────┘
```

### Add card flow

1. User types in search box.
2. Results show catalog cards (brief).
3. User selects a card → adds/merges by **name** (increment qty if name exists).
4. Quantity capped at 4 in UI (soft — can still warn if user imports more).

### Card grid

- Show representative image: first catalog print matching the name (prefer legal Standard print with lowest set number).
- Badge: `×{quantity}` overlay.
- Illegal name: red border or warning icon.
- Click → navigate to card detail ( `/cards/[id]` ) for representative print.

## Folders

| Property | Type | Notes |
|----------|------|-------|
| `id` | uuid | |
| `name` | string | Required, unique per user |
| `parent_id` | uuid? | Nullable — one level deep in v1 (no nested subfolders) |
| `sort_order` | int | Manual ordering |

A deck belongs to **zero or one** folder.

## Tags

| Property | Type | Notes |
|----------|------|-------|
| `id` | uuid | |
| `name` | string | Unique per user, lowercase normalized |
| `color` | string? | Optional hex for UI chip |

Many-to-many with decks.

## PTCGL import/export

### Format

PTCGL uses line-based text:

```
4 Ultra Ball
3 Boss's Orders
2 Charizard ex
1 Arven
12 Basic Fire Energy
```

With optional set and number:

```
4 Ultra Ball MEW 196
3 Boss's Orders PAL 172
2 Charizard ex OBF 125
```

Common patterns:
- `{quantity} {card name}`
- `{quantity} {card name} {set code} {number}`

### Import

**Input methods:**
1. **Paste** — textarea modal, user pastes decklist text.
2. **File upload** — `.txt` file.

**Parse logic:**

```typescript
// Per line (skip empty, skip comments starting with # or //)
const LINE_REGEX = /^(\d+)\s+(.+?)(?:\s+([A-Za-z0-9]+)\s+(\S+))?$/;

interface ParsedLine {
  quantity: number;
  cardName: string;
  setCode?: string;
  cardNumber?: string;
}
```

**Resolution:**
1. If set code + number provided → find exact catalog card → use its `name`.
2. Else → fuzzy match `cardName` against catalog `name` (exact match preferred, then normalized).
3. Unresolved lines → warning `IMPORT_UNRESOLVED: "{line}"` — skip or add as unresolved entry.

**Merge:** Group by resolved card name, sum quantities.

**Post-import:** Run validation; show import summary (X cards imported, Y lines unresolved).

**Known quirks (handle in parser):**
- Strip leading zeros from card numbers (`018` → `18`).
- Trim whitespace.
- Case-insensitive name matching.

### Export

Generate PTCGL-compatible text:

```
{quantity} {card name}
```

Use the card name as stored in deck (canonical catalog name after resolution).

Optionally include set code + number of the representative print:

```
{quantity} {name} {setId} {localId}
```

Default export: **name only** (simpler, matches most PTCGL imports). Setting in deck export modal: "Include set numbers" toggle (off by default).

**Grouping:** Export sections optional — Pokémon, Trainer, Energy (PTCGL accepts flat list; grouped is nicer for reading).

### Export download

- Copy to clipboard button.
- Download as `.txt` file.

## Data model (summary)

See `08-data-model.md` for full schema.

```
decks (id, name, folder_id, notes, created_at, updated_at)
deck_cards (id, deck_id, card_name, normalized_name, quantity)
deck_tags (deck_id, tag_id)
folders (id, name, parent_id, sort_order)
tags (id, name, color)
```

## API endpoints (summary)

See `09-api.md`.

| Method | Route | Action |
|--------|-------|--------|
| GET | `/api/decks` | List decks (filter by folder, tag) |
| POST | `/api/decks` | Create deck |
| GET | `/api/decks/[id]` | Get deck with cards, stats, warnings |
| PATCH | `/api/decks/[id]` | Update name, folder, notes |
| DELETE | `/api/decks/[id]` | Delete deck |
| PUT | `/api/decks/[id]/cards` | Replace all deck cards |
| POST | `/api/decks/[id]/cards` | Add/update single card entry |
| POST | `/api/decks/[id]/import` | Import PTCGL text |
| GET | `/api/decks/[id]/export` | Export PTCGL text |
| CRUD | `/api/folders` | Folder management |
| CRUD | `/api/tags` | Tag management |

## UI states

| State | Behavior |
|-------|----------|
| Empty deck | Show placeholder "Search to add your first card" |
| 60/60 exactly | Subtle success indicator (green count) |
| Warnings present | Amber badge on stats panel; list warnings |
| Card not in catalog | Gray card placeholder with name text |
