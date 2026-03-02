import path from "path";
import fs from "fs";

export const getDbPath = () => {
  // In production (Render)
  if (process.env.NODE_ENV === "production") {
    // Use a persistent path that Render can access
    // For free tier, this will still be ephemeral
    return "/opt/render/project/src/data/sqlite.db";
  }

  // In development, use local file (not committed to git)
  return path.join(process.cwd(), "data", "dev.sqlite.db");
};

export const ensureDbDirectory = () => {
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
};
