import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
});

export const accounts = sqliteTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
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

// IMPORTANT: For NextAuth Drizzle Adapter, sessionToken MUST be the primary key
export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  tileBaseUrl: text("tile_base_url").notNull(),
  defaultBounds: text("default_bounds"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const maps = sqliteTable("maps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("gameId")
    .notNull()
    .references(() => games.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  tilePath: text("tile_path").notNull(),
  defaultCenter: text("default_center"),
  defaultZoom: integer("default_zoom").default(11),
  mapData: text("mapData"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

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
  locationId: integer("locationId").notNull(),
  mapId: integer("mapId")
    .notNull()
    .references(() => maps.id),
});

// Unique constraint to prevent duplicates
export const foundLocationsUnique = sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_found_locations_unique ON found_locations(characterId, locationId, mapId)`;
