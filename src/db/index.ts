import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Use environment variable for database path
const dbPath =
  process.env.DATABASE_URL?.replace("file:", "") || path.join(process.cwd(), "src/db/sqlite.db");
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
