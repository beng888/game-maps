import { db } from "./index";
import { games, maps } from "./schema";
import fs from "fs";
import path from "path";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(maps);
  await db.delete(games);

  // Insert Fallout New Vegas
  const [falloutNV] = await db
    .insert(games)
    .values({
      name: "Fallout New Vegas",
      slug: "fallout-new-vegas",
    })
    .returning();

  // Read the Mojave Wasteland JSON data
  const mojaveDataPath = path.join(__dirname, "data", "mojave-wasteland.json");
  const mojaveData = JSON.parse(fs.readFileSync(mojaveDataPath, "utf-8"));

  // Insert maps for Fallout New Vegas
  await db.insert(maps).values([
    {
      gameId: falloutNV.id,
      name: "Mojave Wasteland",
      slug: "mojave-wasteland",
      description: "The main desert region of the Mojave Wasteland",
      mapData: JSON.stringify(mojaveData), // Store the entire JSON data
    },
    {
      gameId: falloutNV.id,
      name: "Sierra Madre",
      slug: "sierra-madre",
      description: "The treacherous Sierra Madre casino and surrounding area",
      mapData: null, // Will add later
    },
    {
      gameId: falloutNV.id,
      name: "Zion Canyon",
      slug: "zion-canyon",
      description: "The beautiful and dangerous Zion National Park",
      mapData: null, // Will add later
    },
    {
      gameId: falloutNV.id,
      name: "Big MT",
      slug: "big-mt",
      description: "The Big Empty research facility",
      mapData: null, // Will add later
    },
    {
      gameId: falloutNV.id,
      name: "The Divide",
      slug: "the-divide",
      description: "The destructive and mysterious Divide",
      mapData: null, // Will add later
    },
  ]);

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
