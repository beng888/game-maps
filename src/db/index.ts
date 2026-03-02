import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { getDbPath } from "./config";

const sqlite = new Database(getDbPath());
export const db = drizzle(sqlite, { schema });
