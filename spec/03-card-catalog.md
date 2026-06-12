# Card Catalog

The catalog is the read-only reference layer. All card discovery, deck building search, and detail views read from the local database, which is populated by syncing from TCGdex.

## Data source

| Property | Value |
|----------|-------|
| API | [TCGdex REST API](https://tcgdex.dev) |
| Base URL | `https://api.tcgdex.net/v2/en` |
| SDK (optional) | `@tcgdex/sdk` from JSR |
| Language | English only (`/en/` scope) |
| Auth | None required (free, open API) |
| Estimated card count | ~22,000 |

### Key endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /cards` | List all cards (brief: id, name, image, localId) |
| `GET /cards/{id}` | Full card detail |
| `GET /sets` | List all sets |
| `GET /sets/{id}` | Set detail with card list |

Pagination and filtering are supported via the SDK query builder. For bulk sync, iterate all cards by fetching the full list then hydrating details in batches.

## Sync behavior

### Trigger

Manual **"Sync catalog"** button in the app settings/admin area. No automatic background sync in v1.

### Sync phases

```
Phase 1: Sync sets
  GET /sets → upsert into `sets` table

Phase 2: Sync card briefs
  GET /cards → upsert id, name, image_url, set_id, local_id into `cards` (minimal)

Phase 3: Hydrate card details (chunked)
  For each card missing detail OR stale (see staleness):
    GET /cards/{id} → upsert full normalized fields

Phase 4: Compute derived fields
  - name_is_standard_legal (see 04-standard-rules.md)
  - is_ace_spec
  - normalized_name (for copy-limit grouping)
```

### Chunking (Vercel constraint)

- Process **50–100 cards per server action/API call**.
- UI shows progress bar: `Syncing cards… 1,240 / 22,000`.
- Client orchestrates multiple requests until complete.
- Each chunk is idempotent (upsert on `cards.id`).

### Staleness

Store `catalog_synced_at` on each card (`updated` from TCGdex). Re-sync updates changed cards. Full re-sync is safe to run anytime.

### Fields to **exclude** from sync

| Field | Action |
|-------|--------|
| `pricing` | **Discard entirely** — never persist |
| `pricing.*` | **Discard** |
| Any price history | **Never implement** |

### Fields to persist (lean schema)

#### All cards

| DB column | TCGdex source | Notes |
|-----------|---------------|-------|
| `id` | `id` | Primary key |
| `name` | `name` | |
| `normalized_name` | computed | Lowercase, trimmed, for grouping |
| `category` | `category` | Pokemon / Trainer / Energy |
| `image_url` | `image` | Hot-link URL |
| `local_id` | `localId` | Card number in set |
| `rarity` | `rarity` | |
| `illustrator` | `illustrator` | |
| `regulation_mark` | `regulationMark` | Nullable for very old cards |
| `legal_standard_print` | `legal.standard` | Print-level from API |
| `name_is_standard_legal` | computed | Name-level tournament legality |
| `set_id` | `set.id` | FK |
| `variants` | `variants` | JSONB — holo/normal/reverse flags |
| `tcgdex_updated_at` | `updated` | |
| `catalog_synced_at` | now() | |

#### Pokémon-only

| DB column | TCGdex source |
|-----------|---------------|
| `hp` | `hp` |
| `types` | `types` | JSONB array |
| `stage` | `stage` |
| `evolve_from` | `evolveFrom` |
| `dex_ids` | `dexId` | JSONB array |
| `attacks` | `attacks` | JSONB |
| `abilities` | `abilities` | JSONB if present |
| `weaknesses` | `weaknesses` | JSONB |
| `resistances` | `resistances` | JSONB |
| `retreat` | `retreat` |

#### Trainer-only

| DB column | TCGdex source |
|-----------|---------------|
| `trainer_type` | `trainerType` |
| `effect` | `effect` |

#### Energy-only

| DB column | TCGdex source |
|-----------|---------------|
| `energy_type` | `energyType` |
| `effect` | `effect` |

#### Derived

| DB column | Logic |
|-----------|-------|
| `is_ace_spec` | `rarity` contains `ACE SPEC` OR card name/rules indicate ACE SPEC |
| `is_basic_energy` | `category = Energy` AND `energy_type = Basic` |

Do **not** store full raw TCGdex JSON blobs. Normalized columns only.

### Sets table

| DB column | TCGdex source |
|-----------|---------------|
| `id` | `id` |
| `name` | `name` |
| `series` | series id/name if available |
| `logo_url` | `logo` |
| `symbol_url` | `symbol` |
| `official_count` | `cardCount.official` |
| `total_count` | `cardCount.total` |
| `release_date` | if available from set endpoint |

### Sync metadata table

| Column | Purpose |
|--------|---------|
| `last_full_sync_at` | Timestamp of last completed sync |
| `last_sync_status` | `idle` / `running` / `completed` / `failed` |
| `last_sync_error` | Error message if failed |
| `cards_synced_count` | Progress counter |

## Regulation / legality from API

TCGdex provides per-print `legal.standard`. Use this as the primary print-level source.

**Name-level legality** is computed after sync:

```sql
-- Pseudologic
FOR each distinct normalized_name:
  name_is_standard_legal = EXISTS (
    card WHERE normalized_name = X AND legal_standard_print = true
  )
```

Also maintain a config table for legal regulation marks (see `04-standard-rules.md`) to recompute if API lags a rotation.

## Search

Catalog search queries the local `cards` table (not live TCGdex on every keystroke).

| Search by | Index |
|-----------|-------|
| Name (partial, case-insensitive) | `normalized_name` trigram or ILIKE |
| Set | `set_id` |
| Category | `category` |
| Regulation mark | `regulation_mark` |
| Standard legal (name-level) | `name_is_standard_legal` |
| Card number in set | `local_id` + `set_id` |

Debounce search input: 300ms. Return brief results (id, name, image_url, set name, regulation_mark, name_is_standard_legal).

## Images

- Store URL only. Render `<img src={image_url}>` client-side.
- TCGdex image URLs support quality suffix: `/high.png`, `/low.webp`, etc. Use `high` for detail view, `low` for thumbnails.
- No image proxy. No local cache in v1.

## Storage budget

| Component | Estimated size |
|-----------|----------------|
| Cards (~22k lean rows) | 80–120 MB |
| Sets (~200 rows) | < 1 MB |
| Indexes | 20–40 MB |
| **Total catalog** | **< 150 MB** |

Well within Neon free tier 0.5 GB limit.

## Error handling

| Error | Behavior |
|-------|----------|
| TCGdex unreachable | Show error toast; sync pauses; retry button |
| Single card 404 during hydrate | Log warning; skip card |
| Sync interrupted mid-chunk | Resume from last completed chunk |
| Rate limiting | Back off 500ms between detail requests if needed |
