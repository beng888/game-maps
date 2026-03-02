import fs from "fs";
import path from "path";

// This should match your production database path
const PROD_DB_PATH = "/opt/render/project/src/data/sqlite.db";

function ensureDbDirectory() {
  const dbPath =
    process.env.NODE_ENV === "production"
      ? PROD_DB_PATH
      : path.join(process.cwd(), "data", "dev.sqlite.db");

  const dbDir = path.dirname(dbPath);

  console.log(`🔧 Ensuring database directory exists: ${dbDir}`);

  if (!fs.existsSync(dbDir)) {
    console.log(`📁 Creating directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  } else {
    console.log(`✅ Directory already exists: ${dbDir}`);
  }

  console.log(`📊 Database will be at: ${dbPath}`);
}

ensureDbDirectory();
