# Collections & Albums

## Overview

The **collection** tracks cards the owner possesses, per specific print, with quantity.

**Albums** are curated groupings that may include cards **not** owned — useful for binder goals, set targets, or themed collections. There is no separate wishlist feature.

## User stories

### Collection

| ID | Story |
|----|-------|
| C-01 | As the owner, I can search for a card and add it to my collection. |
| C-02 | As the owner, I can set quantity per print. |
| C-03 | As the owner, I can view my full collection as a searchable grid/list. |
| C-04 | As the owner, I can filter collection by set, category, rarity. |
| C-05 | As the owner, I can remove or decrement cards from my collection. |
| C-06 | As the owner, I can see set completion progress for each expansion. |

### Albums

| ID | Story |
|----|-------|
| A-01 | As the owner, I can create named albums. |
| A-02 | As the owner, I can add any catalog card to an album (owned or not). |
| A-03 | As the owner, I can view an album as 3×3 binder pages. |
| A-04 | As the owner, I can navigate between binder pages. |
| A-05 | As the owner, I can set an album cover card. |
| A-06 | As the owner, I can see which album cards I own vs don't own. |

## Collection

Route: `/collection`

### Add card flow

1. Search catalog (same search as deck builder).
2. Select a **specific print** (show set name + number in results).
3. Quantity stepper (default 1).
4. Save → upsert `collection_entries` on `(card_id)`.

### Collection entry

| Field | Type | Notes |
|-------|------|-------|
| `card_id` | string | FK to catalog `cards.id` — specific print |
| `quantity` | int | Min 0; 0 = delete entry |

No condition (NM/LP) or foil tracking in v1. Variants (holo/reverse) are separate prints in the catalog.

### Collection view

```
┌─────────────────────────────────────────────────┐
│ Collection                    [Search…] [+ Add] │
│ Filters: [Set ▾] [Category ▾] [Rarity ▾]       │
├─────────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│ │ ×3 │ │ ×1 │ │ ×2 │ │ ×1 │   (grid)           │
│ └────┘ └────┘ └────┘ └────┘                    │
│ Showing 247 cards (412 total copies)            │
└─────────────────────────────────────────────────┘
```

- Grid with quantity badge.
- Click → card detail view.
- Sort: recently added, name, set, quantity.

## Set completion

Route: `/collection/sets` or tab on collection page.

For each set in catalog:

```
Paldea Evolved (sv02)
████████████░░░░░░░░  142 / 193  (73.6%)
[View missing] [View owned]
```

### Completion logic

```
owned_in_set = COUNT(DISTINCT card.local_id)
  FROM collection_entries ce
  JOIN cards c ON ce.card_id = c.id
  WHERE c.set_id = :setId AND ce.quantity > 0

completion = owned_in_set / set.official_count
```

- Use **official** card count (not total with secrets).
- A card counts as "owned" if quantity > 0 for that `local_id`.
- Secret rares above official count are bonus, not required for 100%.

### Missing cards view

List catalog cards in set where no collection entry exists (or quantity = 0). Each row: card image, name, number, [Add to collection] button.

### Auto-generated set albums (optional convenience)

Button: "Create album from set" → creates album pre-filled with all cards in set (unowned). Not required for v1 but low effort enhancement.

## Albums

Route: `/albums`, `/albums/[id]`

### Album properties

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `name` | string | Required |
| `description` | string? | Optional |
| `cover_card_id` | string? | FK to catalog card for cover image |
| `created_at` | timestamp | |

### Album entries

| Field | Type | Notes |
|-------|------|-------|
| `album_id` | uuid | |
| `card_id` | string | FK to catalog — specific print |
| `page` | int | 0-indexed binder page |
| `slot` | int | 0–8 position on page (3×3 grid) |
| `sort_order` | int | Fallback ordering |

Unique constraint: `(album_id, page, slot)` — one card per slot.

### Owned vs unowned indicator

For each album card:

```typescript
const owned = collectionEntries.find(e => e.card_id === card.id && e.quantity > 0);
// UI: green check if owned, hollow/outline if not
```

### Binder view (3×3)

```
┌─────────────────────────────────────┐
│  ← Page 2 of 5 →                    │
├─────────┬─────────┬─────────┤
│  ✓      │  ✓      │  ○      │
│ [card]  │ [card]  │ [card]  │
├─────────┼─────────┼─────────┤
│  ○      │  ✓      │  empty  │
│ [card]  │ [card]  │  [ + ]  │
├─────────┼─────────┼─────────┤
│  ✓      │  ○      │  ✓      │
│ [card]  │ [card]  │ [card]  │
└─────────┴─────────┴─────────┘

✓ = owned   ○ = not owned   [+] = add card to slot
```

- Swipe or arrow keys to change pages on mobile/desktop.
- Empty slots show dashed placeholder with "+" to add card.
- Drag-and-drop reorder between slots (nice-to-have; click-to-swap acceptable for v1).

### Add card to album

1. From album view: click empty slot or [+ Add card].
2. Search catalog → pick specific print.
3. Card placed in next available slot OR chosen slot.
4. Does **not** automatically add to collection.

### Album list view

```
┌─────────────────────────────────────┐
│ Albums                 [+ New Album]│
├─────────────────────────────────────┤
│ ┌──────┐  Favorite Art             │
│ │cover │  27 cards · 12 owned      │
│ └──────┘                            │
│ ┌──────┐  Paldea Evolved Progress   │
│ │cover │  193 cards · 142 owned     │
│ └──────┘                            │
└─────────────────────────────────────┘
```

## Relationship diagram

```
Catalog Card ─────┬──── Collection Entry (qty, owned)
                  │
                  └──── Album Entry (page, slot, may be unowned)
```

A card can appear in multiple albums. Collection and albums are independent except for the owned indicator.

## API endpoints (summary)

See `09-api.md`.

| Method | Route | Action |
|--------|-------|--------|
| GET | `/api/collection` | List collection entries |
| POST | `/api/collection` | Add/update entry |
| DELETE | `/api/collection/[cardId]` | Remove entry |
| GET | `/api/collection/sets` | Set completion summary |
| GET | `/api/collection/sets/[setId]/missing` | Missing cards in set |
| GET | `/api/albums` | List albums |
| POST | `/api/albums` | Create album |
| GET | `/api/albums/[id]` | Album with entries |
| PATCH | `/api/albums/[id]` | Update name, cover |
| DELETE | `/api/albums/[id]` | Delete album |
| PUT | `/api/albums/[id]/entries` | Replace/reorder entries |
| POST | `/api/albums/[id]/entries` | Add card to slot |
