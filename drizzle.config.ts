import type { Config } from "drizzle-kit";
import path from "path";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "production"
        ? "/opt/render/project/src/data/sqlite.db"
        : path.join(process.cwd(), "data", "dev.sqlite.db"),
  },
} satisfies Config;
