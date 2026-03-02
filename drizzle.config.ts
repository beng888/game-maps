import type { Config } from "drizzle-kit";
import path from "path";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "production"
        ? path.join("/opt/render/project/src", process.env.DATABASE_URL || "./src/db/sqlite.db")
        : process.env.DATABASE_URL || "./src/db/sqlite.db",
  },
} satisfies Config;
