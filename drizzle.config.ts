import type { Config } from "drizzle-kit";
import path from "path";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "production"
        ? "/opt/render/project/src/src/db/sqlite.db"
        : "./src/db/sqlite.db",
  },
} satisfies Config;
