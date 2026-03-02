import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { getDbPath } from "./config";
import fs from "fs";
import path from "path";

// Ensure the directory exists
const dbPath = getDbPath();
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log("Opening database at:", dbPath);
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
