import { db } from "./index";
import { games, maps, users } from "./schema";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Check if we already have data to avoid duplicate seeding
  const existingGames = await db.select().from(games).limit(1);
  if (existingGames.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // First, check if we have any users (they should be created via OAuth)
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length === 0) {
    console.log("No users found. Please sign in first to create a user, then re-run seed.");
    console.log("Skipping seed for now...");
    return;
  }

  console.log("Seeding game data...");

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

  console.log("Added game:", falloutNV.name);

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
    {
      slug: "sierra-madre",
      name: "Sierra Madre",
      tilePath: "fallout-new-vegas/sierra-madre/default-v1",
      defaultCenter: JSON.stringify([-0.8593568483393, 0.71132050351143]),
      defaultZoom: 10,
      description: "The treacherous Sierra Madre casino and surrounding area",
      file: "sierra-madre.json",
    },
    {
      slug: "zion-canyon",
      name: "Zion Canyon",
      tilePath: "fallout-new-vegas/zion-canyon/default-v1",
      defaultCenter: JSON.stringify([-0.80437288889794, 0.64827011938249]),
      defaultZoom: 11,
      description: "The beautiful and dangerous Zion National Park",
      file: "zion-canyon.json",
    },
    {
      slug: "big-mt",
      name: "Big MT",
      tilePath: "fallout-new-vegas/big-mt/default-v1",
      defaultCenter: JSON.stringify([-0.82521207715246, 0.72249280811974]),
      defaultZoom: 11,
      description: "The Big Empty research facility",
      file: "big-mt.json",
    },
    {
      slug: "the-divide",
      name: "The Divide",
      tilePath: "fallout-new-vegas/the-divide/default-v1",
      defaultCenter: JSON.stringify([-0.8043821638268, 0.74278153843068]),
      defaultZoom: 12,
      description: "The destructive and mysterious Divide",
      file: "the-divide.json",
    },
  ];

  // Insert each map with its data
  for (const config of mapConfigs) {
    const dataPath = path.join(__dirname, "data", config.file);

    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      console.log(`Warning: Map data file ${config.file} not found, skipping...`);
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

    console.log(`Added map: ${config.name}`);
  }

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
