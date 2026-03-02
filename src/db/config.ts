import path from "path";

export const getDbPath = () => {
  // In production (Render), use a persistent path in /opt/render/project/src/data
  if (process.env.NODE_ENV === "production") {
    // Ensure the directory exists
    const dbPath = "/opt/render/project/src/data/sqlite.db";
    console.log("Production database path:", dbPath);
    return dbPath;
  }

  // In development, use local file
  return process.env.DATABASE_URL || "./src/db/sqlite.db";
};
