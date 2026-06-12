import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const sets = pgTable("sets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  series: text("series"),
  logoUrl: text("logo_url"),
  symbolUrl: text("symbol_url"),
  officialCount: integer("official_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  releaseDate: date("release_date"),
  catalogSyncedAt: timestamp("catalog_synced_at", { withTimezone: true }),
});

export const cards = pgTable(
  "cards",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    category: text("category").notNull(),
    imageUrl: text("image_url"),
    localId: text("local_id").notNull(),
    setId: text("set_id")
      .notNull()
      .references(() => sets.id),
    rarity: text("rarity"),
    illustrator: text("illustrator"),
    regulationMark: text("regulation_mark"),
    legalStandardPrint: boolean("legal_standard_print"),
    nameIsStandardLegal: boolean("name_is_standard_legal").notNull().default(false),
    isAceSpec: boolean("is_ace_spec").notNull().default(false),
    isBasicEnergy: boolean("is_basic_energy").notNull().default(false),
    hp: integer("hp"),
    types: jsonb("types"),
    stage: text("stage"),
    evolveFrom: text("evolve_from"),
    dexIds: jsonb("dex_ids"),
    attacks: jsonb("attacks"),
    abilities: jsonb("abilities"),
    weaknesses: jsonb("weaknesses"),
    resistances: jsonb("resistances"),
    retreat: integer("retreat"),
    description: text("description"),
    trainerType: text("trainer_type"),
    effect: text("effect"),
    energyType: text("energy_type"),
    variants: jsonb("variants"),
    tcgdexUpdatedAt: timestamp("tcgdex_updated_at", { withTimezone: true }),
    catalogSyncedAt: timestamp("catalog_synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_cards_normalized_name").on(table.normalizedName),
    index("idx_cards_set_id").on(table.setId),
    index("idx_cards_category").on(table.category),
    index("idx_cards_name_standard").on(table.nameIsStandardLegal),
    index("idx_cards_set_local").on(table.setId, table.localId),
  ],
);

export const formatConfig = pgTable(
  "format_config",
  {
    id: integer("id").primaryKey().default(1),
    format: text("format").notNull().default("standard"),
    legalMarks: text("legal_marks").array().notNull().default(sql`'{H,I,J}'`),
    acceptFutureMarks: boolean("accept_future_marks").notNull().default(true),
    rotationEffectiveDate: date("rotation_effective_date"),
  },
  (table) => [check("format_config_singleton", sql`${table.id} = 1`)],
);

export const syncMetadata = pgTable(
  "sync_metadata",
  {
    id: integer("id").primaryKey().default(1),
    lastFullSyncAt: timestamp("last_full_sync_at", { withTimezone: true }),
    lastSyncStatus: text("last_sync_status").default("idle"),
    lastSyncError: text("last_sync_error"),
    cardsSyncedCount: integer("cards_synced_count").default(0),
  },
  (table) => [check("sync_metadata_singleton", sql`${table.id} = 1`)],
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collectionEntries = pgTable(
  "collection_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("collection_entries_user_card").on(table.userId, table.cardId),
    index("idx_collection_user").on(table.userId),
    index("idx_collection_card").on(table.cardId),
    check("collection_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const folders = pgTable(
  "folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    parentId: uuid("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("folders_user_name").on(table.userId, table.name),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
    }).onDelete("set null"),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
  },
  (table) => [unique("tags_user_name").on(table.userId, table.name)],
);

export const decks = pgTable(
  "decks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_decks_user").on(table.userId),
    index("idx_decks_folder").on(table.folderId),
  ],
);

export const deckCards = pgTable(
  "deck_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    cardName: text("card_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [
    unique("deck_cards_deck_name").on(table.deckId, table.normalizedName),
    index("idx_deck_cards_deck").on(table.deckId),
    check(
      "deck_cards_quantity_range",
      sql`${table.quantity} > 0 AND ${table.quantity} <= 99`,
    ),
  ],
);

export const deckTags = pgTable(
  "deck_tags",
  {
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.deckId, table.tagId] })],
);

export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  coverCardId: text("cover_card_id").references(() => cards.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const albumEntries = pgTable(
  "album_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id),
    page: integer("page").notNull().default(0),
    slot: integer("slot").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    unique("album_entries_page_slot").on(table.albumId, table.page, table.slot),
    unique("album_entries_album_card").on(table.albumId, table.cardId),
    index("idx_album_entries_album").on(table.albumId),
    check("album_entries_page_non_negative", sql`${table.page} >= 0`),
    check("album_entries_slot_range", sql`${table.slot} >= 0 AND ${table.slot} <= 8`),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  collectionEntries: many(collectionEntries),
  decks: many(decks),
  albums: many(albums),
  folders: many(folders),
  tags: many(tags),
}));

export const setsRelations = relations(sets, ({ many }) => ({
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  set: one(sets, {
    fields: [cards.setId],
    references: [sets.id],
  }),
  collectionEntries: many(collectionEntries),
  albumEntries: many(albumEntries),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  folder: one(folders, {
    fields: [decks.folderId],
    references: [folders.id],
  }),
  cards: many(deckCards),
  deckTags: many(deckTags),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  coverCard: one(cards, {
    fields: [albums.coverCardId],
    references: [cards.id],
  }),
  entries: many(albumEntries),
}));
