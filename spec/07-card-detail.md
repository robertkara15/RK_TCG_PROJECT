# Card Detail View

## Overview

A unified card detail view used from catalog browse, collection, albums, and decks. Clicking any card opens full information about that **specific print**.

Route: `/cards/[id]`

## User stories

| ID | Story |
|----|-------|
| V-01 | As the owner, I can view a large card image. |
| V-02 | As the owner, I can read full card text (attacks, abilities, effect). |
| V-03 | As the owner, I can see regulation mark and Standard legality status. |
| V-04 | As the owner, I can see how many copies I own of this print. |
| V-05 | As the owner, I can add/remove this print from my collection inline. |
| V-06 | As the owner, I can see other prints of the same card name. |
| V-07 | As the owner, I can see which decks use this card name. |
| V-08 | As the owner, I can see which albums contain this print. |

## Layout

```
┌────────────────────────────────────────────────────────────┐
│ ← Back                                                     │
├──────────────────────┬─────────────────────────────────────┤
│                      │  Ultra Ball                         │
│                      │  Scarlet & Violet · #196 · Uncommon │
│   ┌──────────────┐   │  Regulation: J                      │
│   │              │   │  ┌─────────────────────────────┐    │
│   │  card image  │   │  │ ✓ Standard Legal            │    │
│   │  (high res)  │   │  └─────────────────────────────┘    │
│   │              │   │                                     │
│   └──────────────┘   │  Trainer · Item                     │
│                      │                                     │
│                      │  Effect: Search your deck for up to   │
│                      │  2 Pokémon, reveal them, and put    │
│                      │  them into your hand. Shuffle...    │
│                      │                                     │
│                      │  ── Your collection ──              │
│                      │  Owned: 2  [−] [2] [+]  [Remove]    │
│                      │                                     │
│                      │  ── In decks (by name) ──           │
│                      │  • Charizard ex (×4)                │
│                      │  • Lost Box test (×2)               │
│                      │                                     │
│                      │  ── In albums ──                    │
│                      │  • Favorite Trainers                  │
│                      │                                     │
│                      │  ── Other prints ──                 │
│                      │  [thumb] [thumb] [thumb] →          │
└──────────────────────┴─────────────────────────────────────┘
```

Mobile: image on top, details below (single column).

## Fields displayed

### Header

| Field | Source |
|-------|--------|
| Name | `cards.name` |
| Set name | `sets.name` |
| Card number | `cards.local_id` / `sets.official_count` |
| Rarity | `cards.rarity` |
| Illustrator | `cards.illustrator` |

### Legality badge

| State | Condition | Display |
|-------|-----------|---------|
| Standard Legal | `name_is_standard_legal = true` | Green badge |
| Not Standard Legal | `name_is_standard_legal = false` | Red badge |
| Print mark illegal, name legal | print `legal_standard_print = false` but name legal | Green badge + note: "Legal via reprint rule" |

### Category-specific

**Pokémon:**
- HP, types (with type color icons)
- Stage, evolves from
- Abilities (name + effect)
- Attacks (cost, name, damage, effect)
- Weakness, resistance, retreat cost
- Pokédex flavor text (`description`)

**Trainer:**
- Trainer type (Supporter / Item / Stadium / Tool)
- Effect text

**Energy:**
- Energy type (Basic / Special)
- Effect text (if Special)

### Variants (informational)

Show available variants from `variants` JSON: Normal, Reverse, Holo, First Edition — no pricing.

### ACE SPEC indicator

If `is_ace_spec`, show badge: "ACE SPEC — max 1 per deck".

## Collection actions (inline)

| Action | Behavior |
|--------|----------|
| Quantity stepper | Upsert `collection_entries` for this `card_id` |
| Remove | Set quantity to 0 / delete entry |
| Add to album | Opens album picker modal |

## Related data

### Other prints (same name)

Query: `SELECT * FROM cards WHERE normalized_name = ? AND id != ? ORDER BY set release_date DESC`

Show horizontal scroll of thumbnails. Click navigates to that print's detail page.

### Decks containing this card (by name)

Query: `deck_cards WHERE normalized_name = ?` joined with `decks`.

Show deck name + quantity of that name in deck.

### Albums containing this print

Query: `album_entries WHERE card_id = ?` joined with `albums`.

## Browse / search entry point

Route: `/cards`

```
┌─────────────────────────────────────────────────┐
│ Cards                         [Sync Catalog]    │
│ [Search by name, set, number…]                  │
│ Filters: [Standard legal ☐] [Category ▾] [Set ▾]│
├─────────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ │    │ │    │ │    │ │    │ │    │ │    │     │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘     │
│ (infinite scroll or pagination)                 │
└─────────────────────────────────────────────────┘
```

This is the **v1 priority** entry point — polished browse experience first.

## Image rendering

```html
<img
  src={`${card.image_url}/high.webp`}
  alt={card.name}
  loading="lazy"
/>
```

Fallback if image missing: placeholder with card name initials.

## What is NOT shown

- Prices (any currency)
- Price history
- TCGPlayer / Cardmarket links
- Expanded legality (Standard only — may show small "Expanded: yes/no" from API if useful, but not emphasized)
