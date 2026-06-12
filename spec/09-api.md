# API Specification

All routes require authentication except `/api/auth/*` and public assets.

Base: `https://{vercel-domain}/api`

Auth: Session cookie via Auth.js (Credentials provider).

## Auth

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signin` | Email + password login |
| POST | `/api/auth/signout` | Logout |
| GET | `/api/auth/session` | Current session |

Sign-up route is **disabled** after owner account exists. Bootstrap via deployment env vars.

### Bootstrap (one-time)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/bootstrap` | Create owner account if no users exist. Body: `{ email, password }`. Only works when `users` table is empty. |

## Catalog

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cards` | Search/list cards |
| GET | `/api/cards/[id]` | Card detail with relations |
| GET | `/api/cards/[id]/prints` | Other prints of same name |
| GET | `/api/sets` | List sets |
| GET | `/api/sets/[id]` | Set detail |
| POST | `/api/catalog/sync` | Start catalog sync chunk |
| GET | `/api/catalog/sync/status` | Sync progress |

### `GET /api/cards`

Query params:

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Name search (partial) |
| `set` | string | Set id filter |
| `category` | string | Pokemon / Trainer / Energy |
| `standardLegal` | boolean | Filter `name_is_standard_legal` |
| `page` | number | Default 1 |
| `limit` | number | Default 40, max 100 |

Response:

```json
{
  "data": [
    {
      "id": "sv01-196",
      "name": "Ultra Ball",
      "imageUrl": "https://assets.tcgdex.net/en/sv/sv01/196",
      "set": { "id": "sv01", "name": "Scarlet & Violet" },
      "localId": "196",
      "regulationMark": "G",
      "nameIsStandardLegal": true,
      "category": "Trainer"
    }
  ],
  "pagination": { "page": 1, "limit": 40, "total": 1523 }
}
```

### `GET /api/cards/[id]`

Response includes full card fields plus:

```json
{
  "card": { /* full card */ },
  "collection": { "quantity": 2 },
  "decks": [{ "id": "...", "name": "Charizard ex", "quantity": 4 }],
  "albums": [{ "id": "...", "name": "Favorite Trainers" }],
  "otherPrints": [{ "id": "...", "set": "...", "imageUrl": "..." }]
}
```

### `POST /api/catalog/sync`

Body:

```json
{
  "phase": "sets" | "briefs" | "details",
  "offset": 0,
  "batchSize": 50
}
```

Response:

```json
{
  "phase": "details",
  "processed": 50,
  "total": 22000,
  "complete": false,
  "nextOffset": 50
}
```

Client loops until `complete: true`.

## Collection

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/collection` | List entries with card briefs |
| POST | `/api/collection` | Upsert entry `{ cardId, quantity }` |
| DELETE | `/api/collection/[cardId]` | Remove entry |
| GET | `/api/collection/sets` | Set completion summary |
| GET | `/api/collection/sets/[setId]/missing` | Missing cards in set |

### `GET /api/collection/sets`

Response:

```json
{
  "data": [
    {
      "set": { "id": "sv02", "name": "Paldea Evolved", "officialCount": 193 },
      "ownedCount": 142,
      "completionPercent": 73.58
    }
  ]
}
```

## Albums

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/albums` | List albums with card counts |
| POST | `/api/albums` | Create `{ name, description? }` |
| GET | `/api/albums/[id]` | Album with entries grouped by page |
| PATCH | `/api/albums/[id]` | Update name, description, coverCardId |
| DELETE | `/api/albums/[id]` | Delete album |
| POST | `/api/albums/[id]/entries` | Add `{ cardId, page?, slot? }` |
| PATCH | `/api/albums/[id]/entries/[entryId]` | Move slot/page |
| DELETE | `/api/albums/[id]/entries/[entryId]` | Remove from album |

### `GET /api/albums/[id]`

Response:

```json
{
  "album": { "id": "...", "name": "...", "coverCardId": "..." },
  "pages": [
    {
      "page": 0,
      "slots": [
        { "slot": 0, "card": { /* brief */ }, "owned": true },
        { "slot": 1, "card": null },
        { "slot": 2, "card": { /* brief */ }, "owned": false }
      ]
    }
  ],
  "stats": { "totalCards": 27, "ownedCount": 12 }
}
```

## Decks

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/decks` | List decks. Query: `folder`, `tag` |
| POST | `/api/decks` | Create `{ name, folderId? }` |
| GET | `/api/decks/[id]` | Deck with cards, stats, warnings |
| PATCH | `/api/decks/[id]` | Update name, folderId, notes, tagIds |
| DELETE | `/api/decks/[id]` | Delete deck |
| PUT | `/api/decks/[id]/cards` | Replace all cards `[{ cardName, quantity }]` |
| POST | `/api/decks/[id]/cards` | Add/update `{ cardName, quantity }` |
| DELETE | `/api/decks/[id]/cards/[normalizedName]` | Remove card |
| POST | `/api/decks/[id]/import` | Import PTCGL text |
| GET | `/api/decks/[id]/export` | Export PTCGL text |

### `GET /api/decks/[id]`

Response:

```json
{
  "deck": { "id": "...", "name": "...", "folderId": "...", "tags": [] },
  "cards": [
    {
      "cardName": "Ultra Ball",
      "normalizedName": "ultra ball",
      "quantity": 4,
      "representativeCard": { "id": "...", "imageUrl": "..." },
      "nameIsStandardLegal": true
    }
  ],
  "stats": { "totalCards": 60, "pokemon": 18, "trainer": 32, "energy": 10, "trainers": {}, "pokemonBreakdown": {}, "energyBreakdown": {}, "aceSpecCount": 1 },
  "validation": {
    "isValid": false,
    "warnings": [{ "ruleId": "DECK_SIZE", "severity": "warning", "message": "Deck has 58/60 cards" }]
  }
}
```

### `POST /api/decks/[id]/import`

Body:

```json
{
  "text": "4 Ultra Ball\n3 Boss's Orders\n...",
  "mode": "replace" | "merge"
}
```

Response:

```json
{
  "imported": 58,
  "unresolved": ["1 Unknown Card XYZ"],
  "deck": { /* full deck response */ }
}
```

### `GET /api/decks/[id]/export`

Query: `includeSetNumbers=false`

Response:

```json
{
  "text": "4 Ultra Ball\n3 Boss's Orders\n...",
  "filename": "charizard-ex.txt"
}
```

## Folders & Tags

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/folders` | List / create folders |
| PATCH/DELETE | `/api/folders/[id]` | Update / delete |
| GET/POST | `/api/tags` | List / create tags |
| PATCH/DELETE | `/api/tags/[id]` | Update / delete |

## Error responses

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

| HTTP | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | No session |
| 403 | FORBIDDEN | Sign-up disabled |
| 404 | NOT_FOUND | Resource missing |
| 400 | VALIDATION_ERROR | Invalid input |
| 500 | INTERNAL_ERROR | Server error |

## Rate limiting (optional v1)

Basic middleware: max 100 requests/minute per session. Low priority for single-user app.

## Server actions alternative

Deck/collection mutations may use Next.js Server Actions instead of REST where simpler. API routes are the contract of record; Server Actions are implementation detail.
