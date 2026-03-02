import path from "path";

export const getDbPath = () => {
  // In production (Render), use a persistent path
  if (process.env.NODE_ENV === "production") {
    // Use /var/data or a similar persistent volume
    // You'll need to set this up in Render
    return process.env.DATABASE_URL || "/var/data/sqlite.db";
  }

  // In development, use local file
  return process.env.DATABASE_URL || "./src/db/sqlite.db";
};
