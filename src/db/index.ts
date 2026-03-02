/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { getDbPath, ensureDbDirectory } from "./config";

console.log("🔧 Initializing database...");
ensureDbDirectory();

const dbPath = getDbPath();
console.log(`📊 Database path: ${dbPath}`);

// Check if file exists
const fs = require("fs");
if (fs.existsSync(dbPath)) {
  console.log(`✅ Database file exists (${fs.statSync(dbPath).size} bytes)`);
} else {
  console.log("❌ Database file does not exist yet");
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Test query to verify tables
try {
  const result = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("📋 Tables in database:", result.map((t: any) => t.name).join(", "));
} catch (e) {
  console.log("❌ Could not query tables");
}
