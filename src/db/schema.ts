import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
});

export const accounts = sqliteTable("account", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("session", {
  id: text("id")
    .primaryKey()
    .default(sql`(lower(hex(randomblob(16))))`),
  sessionToken: text("sessionToken").unique().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
});

export const maps = sqliteTable("maps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("gameId")
    .notNull()
    .references(() => games.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  mapData: text("mapData"),
});

// New tables for character tracking
export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameId: integer("gameId")
    .notNull()
    .references(() => games.id),
  name: text("name").notNull(),
  level: integer("level").default(1),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const foundLocations = sqliteTable("found_locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("characterId")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  locationId: integer("locationId").notNull(), // The ID from the map data
  mapId: integer("mapId")
    .notNull()
    .references(() => maps.id),
  foundAt: integer("foundAt", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Unique constraint to prevent duplicates
export const foundLocationsUnique = sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_found_locations_unique ON found_locations(characterId, locationId, mapId)`;
