import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { getDbPath } from "./config";
import fs from "fs";
import path from "path";

// Ensure directory exists (in development)
if (process.env.NODE_ENV !== "production") {
  const dbDir = path.dirname(getDbPath());
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const sqlite = new Database(getDbPath());
export const db = drizzle(sqlite, { schema });
