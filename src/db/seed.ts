import { db } from "./index";
import { games, maps } from "./schema";

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

  // Insert maps for Fallout New Vegas
  await db.insert(maps).values([
    {
      gameId: falloutNV.id,
      name: "Mojave Wasteland",
      slug: "mojave-wasteland",
      description: "The main desert region of the Mojave Wasteland",
    },
    {
      gameId: falloutNV.id,
      name: "Sierra Madre",
      slug: "sierra-madre",
      description: "The treacherous Sierra Madre casino and surrounding area",
    },
    {
      gameId: falloutNV.id,
      name: "Zion Canyon",
      slug: "zion-canyon",
      description: "The beautiful and dangerous Zion National Park",
    },
    {
      gameId: falloutNV.id,
      name: "Big MT",
      slug: "big-mt",
      description: "The Big Empty research facility",
    },
    {
      gameId: falloutNV.id,
      name: "The Divide",
      slug: "the-divide",
      description: "The destructive and mysterious Divide",
    },
  ]);

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
