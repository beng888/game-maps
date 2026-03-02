/** biome-ignore-all lint/correctness/noUnusedImports: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedVariables: <explanation> */
import { db } from "./index";
import { games, maps } from "./schema";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";

async function seedProduction() {
  console.log("🌱 Checking if production seeding is needed...");

  try {
    // Try to query games table to see if it exists
    await db.select().from(games).limit(1);
    console.log("✅ Tables already exist, skipping seed.");
    return;
  } catch (error) {
    console.log("⚠️ Tables not found, creating tables via seed...");

    // If tables don't exist, we need to create them
    // Note: This assumes migrations have already run
    console.log("Running schema creation...");
  }

  console.log("🌱 Seeding production database...");

  // Insert Fallout New Vegas
  const [falloutNV] = await db
    .insert(games)
    .values({
      name: "Fallout New Vegas",
      slug: "fallout-new-vegas",
      tileBaseUrl: "https://tiles.mapgenie.io/games",
      defaultBounds: JSON.stringify([-1.4, 0, 0, 1.4]),
    })
    .returning();

  console.log("✅ Added game:", falloutNV.name);

  // Map configurations
  const mapConfigs = [
    {
      slug: "mojave-wasteland",
      name: "Mojave Wasteland",
      tilePath: "fallout-new-vegas/mojave-wasteland/default-v2",
      defaultCenter: JSON.stringify([-0.79407843012208, 0.70144020169235]),
      defaultZoom: 11,
      description: "The main desert region of the Mojave Wasteland",
      file: "mojave-wasteland.json",
    },
    // ... add all other maps
  ];

  for (const config of mapConfigs) {
    const dataPath = path.join(__dirname, "data", config.file);

    if (!fs.existsSync(dataPath)) {
      console.log(`⚠️ Warning: Map data file ${config.file} not found, skipping...`);
      continue;
    }

    const mapData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    await db.insert(maps).values({
      gameId: falloutNV.id,
      name: config.name,
      slug: config.slug,
      description: config.description,
      tilePath: config.tilePath,
      defaultCenter: config.defaultCenter,
      defaultZoom: config.defaultZoom,
      mapData: JSON.stringify(mapData),
    });

    console.log(`✅ Added map: ${config.name}`);
  }

  console.log("✅ Production database seeded successfully!");
}

seedProduction().catch(console.error);
