import path from "path";

export const getDbPath = (): string => {
  // In production (Render)
  if (process.env.NODE_ENV === "production") {
    // Ensure directory exists (this will be handled by build script)
    return "/opt/render/project/src/src/db/sqlite.db";
  }

  // In development
  return path.join(process.cwd(), "src", "db", "sqlite.db");
};
