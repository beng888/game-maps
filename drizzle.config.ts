import type { Config } from "drizzle-kit";
import path from "path";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(process.cwd(), "data", "dev.sqlite.db"),
  },
} satisfies Config;
