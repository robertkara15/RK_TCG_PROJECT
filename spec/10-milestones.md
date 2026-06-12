# Milestones

Phased delivery plan for RK_TCG_PROJECT. Each milestone is deployable.

## M0 — Project scaffold & auth

**Goal:** Empty app deployed with login working.

### Tasks

- [ ] Initialize Next.js (App Router) + TypeScript + Tailwind
- [ ] Configure Drizzle + Neon Postgres connection
- [ ] Run migrations: catalog tables, auth tables, user data tables
- [ ] Implement Auth.js Credentials provider
- [ ] Bootstrap owner account on first deploy
- [ ] Disable public sign-up
- [ ] Deploy to Vercel with env vars
- [ ] Dark mode base layout (responsive shell)
- [ ] Protected route middleware

### Acceptance

- Owner can log in from phone and laptop
- Unauthenticated users redirected to login
- Public repo pushed; secrets only in Vercel

**Estimate:** 1–2 days

---

## M1 — Card catalog & browse (v1 priority)

**Goal:** Sync TCGdex and browse/search all English cards.

### Tasks

- [ ] Implement TCGdex sync (sets → briefs → details, chunked)
- [ ] Sync UI with progress bar in settings
- [ ] Compute `name_is_standard_legal`, `is_ace_spec`, `is_basic_energy`
- [ ] Seed `format_config` (H, I, J)
- [ ] Card search API with filters
- [ ] `/cards` browse page (grid, infinite scroll)
- [ ] `/cards/[id]` detail view (all fields, no pricing)
- [ ] Hot-linked images with high/low quality

### Acceptance

- Catalog sync completes ~22k cards without timeout
- Search finds cards by name in < 500ms
- Detail view shows full card info and legality badge
- No pricing data anywhere

**Estimate:** 3–4 days

---

## M2 — Collection & set completion

**Goal:** Track owned cards per print; see set progress.

### Tasks

- [ ] Collection CRUD API
- [ ] `/collection` page with search, filters, grid
- [ ] Inline quantity on card detail view
- [ ] Set completion API + `/collection/sets` view
- [ ] Missing cards list per set

### Acceptance

- Add/remove/update quantity per print
- Set completion shows correct owned/official counts
- Collection persists across devices

**Estimate:** 2–3 days

---

## M3 — Decks, stats & validation

**Goal:** Full deck building with soft warnings.

### Tasks

- [ ] Deck CRUD + deck_cards
- [ ] Folders and tags
- [ ] `/decks` list with folder sidebar
- [ ] `/decks/[id]` editor with card grid
- [ ] Live stats panel
- [ ] `validateDeck()` pure function + unit tests with fixtures
- [ ] Soft warning UI (never block save)

### Acceptance

- Build 60-card deck by name
- Stats show correct Pokémon/Trainer/Energy breakdown
- Warnings for illegal deck, copy limit, ACE SPEC, etc.
- Folders and tags work

**Estimate:** 3–4 days

---

## M4 — Albums & binder view

**Goal:** Albums with 3×3 binder pages.

### Tasks

- [ ] Album CRUD API
- [ ] `/albums` list page
- [ ] `/albums/[id]` binder view (3×3 pages, navigation)
- [ ] Owned vs unowned indicators
- [ ] Add card to slot flow
- [ ] Cover card selection

### Acceptance

- Album holds owned and unowned cards
- Binder pages navigate correctly on mobile and desktop
- Owned indicator matches collection

**Estimate:** 2–3 days

---

## M5 — PTCGL import/export

**Goal:** Import and export decklists compatible with Pokémon TCG Live.

### Tasks

- [ ] PTCGL text parser
- [ ] Name resolution against catalog
- [ ] Import modal (paste + file upload)
- [ ] Export to clipboard + .txt download
- [ ] Handle leading zeros, unresolved lines

### Acceptance

- Import typical PTCGL decklist with > 95% resolution
- Export round-trips back into PTCGL
- Unresolved lines reported clearly

**Estimate:** 2 days

---

## M6 — Polish & launch

**Goal:** Production-ready personal app.

### Tasks

- [ ] Loading states, error boundaries, empty states
- [ ] Mobile navigation (bottom nav or hamburger)
- [ ] Keyboard shortcut: `/` to search
- [ ] README with setup instructions (no secrets)
- [ ] Verify Neon + Vercel free tier usage
- [ ] End-to-end smoke test on phone

### Acceptance

- App feels polished in dark mode on phone and laptop
- No console errors on happy path
- README documents local dev + deploy

**Estimate:** 2 days

---

## Total estimate

**~15–20 days** of focused development.

## Dependency graph

```
M0 ──→ M1 ──→ M2
         │
         └──→ M3 ──→ M5
         │
         └──→ M4
         
M2, M3, M4, M5 ──→ M6
```

M2, M3, and M4 can partially overlap after M1.

## Testing strategy

| Layer | Approach |
|-------|----------|
| Validation logic | Unit tests with `fixtures/*.json` |
| PTCGL parser | Unit tests with sample decklists |
| API routes | Integration tests (optional v1) |
| E2E | Manual smoke test per milestone |

## Definition of done (v1)

All acceptance criteria in M0–M6 met. Owner uses app daily for deck building and collection tracking.
