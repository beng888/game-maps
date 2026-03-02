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

  console.log("Added game:", falloutNV.name);

  // Read all map data files
  const mojaveDataPath = path.join(__dirname, "data", "mojave-wasteland.json");
  const sierraMadreDataPath = path.join(__dirname, "data", "sierra-madre.json");
  const zionCanyonDataPath = path.join(__dirname, "data", "zion-canyon.json");
  const bigMtDataPath = path.join(__dirname, "data", "big-mt.json");
  const theDivideDataPath = path.join(__dirname, "data", "the-divide.json");

  const mojaveData = JSON.parse(fs.readFileSync(mojaveDataPath, "utf-8"));
  const sierraMadreData = JSON.parse(fs.readFileSync(sierraMadreDataPath, "utf-8"));
  const zionCanyonData = JSON.parse(fs.readFileSync(zionCanyonDataPath, "utf-8"));
  const bigMtData = JSON.parse(fs.readFileSync(bigMtDataPath, "utf-8"));
  const theDivideData = JSON.parse(fs.readFileSync(theDivideDataPath, "utf-8"));

  // Insert all maps
  await db.insert(maps).values([
    {
      gameId: falloutNV.id,
      name: "Mojave Wasteland",
      slug: "mojave-wasteland",
      description: "The main desert region of the Mojave Wasteland",
      mapData: JSON.stringify(mojaveData),
    },
    {
      gameId: falloutNV.id,
      name: "Sierra Madre",
      slug: "sierra-madre",
      description: "The treacherous Sierra Madre casino and surrounding area",
      mapData: JSON.stringify(sierraMadreData),
    },
    {
      gameId: falloutNV.id,
      name: "Zion Canyon",
      slug: "zion-canyon",
      description: "The beautiful and dangerous Zion National Park",
      mapData: JSON.stringify(zionCanyonData),
    },
    {
      gameId: falloutNV.id,
      name: "Big MT",
      slug: "big-mt",
      description: "The Big Empty research facility",
      mapData: JSON.stringify(bigMtData),
    },
    {
      gameId: falloutNV.id,
      name: "The Divide",
      slug: "the-divide",
      description: "The destructive and mysterious Divide",
      mapData: JSON.stringify(theDivideData),
    },
  ]);

  console.log("All maps seeded successfully!");
  console.log("- Mojave Wasteland");
  console.log("- Sierra Madre");
  console.log("- Zion Canyon");
  console.log("- Big MT");
  console.log("- The Divide");
}

seed().catch(console.error);
