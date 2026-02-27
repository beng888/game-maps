import { db } from "@/db";
import { games, maps } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";

interface MapPageProps {
  params: {
    gameSlug: string;
    mapSlug: string;
  };
}

export default async function MapPage({ params }: MapPageProps) {
  const [game] = await db.select().from(games).where(eq(games.slug, params.gameSlug)).limit(1);

  if (!game) {
    notFound();
  }

  const [map] = await db
    .select()
    .from(maps)
    .where(and(eq(maps.gameId, game.id), eq(maps.slug, params.mapSlug)))
    .limit(1);

  if (!map) {
    notFound();
  }

  // Get all maps for this game for the map selector
  const gameMaps = await db.select().from(maps).where(eq(maps.gameId, game.id));

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link href={`/games/${game.slug}`} className="text-blue-500 hover:text-blue-700">
            ← Back to {game.name} Maps
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">{map.name}</h1>
        <p className="text-gray-600 mb-6">{map.description}</p>

        {/* Map Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Select a different map:</h2>
          <div className="flex flex-wrap gap-2">
            {gameMaps.map((gameMap) => (
              <Link
                key={gameMap.id}
                href={`/games/${game.slug}/${gameMap.slug}`}
                className={`px-4 py-2 rounded ${
                  gameMap.id === map.id ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {gameMap.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Placeholder for map content */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <h3 className="text-xl text-gray-500 mb-4">Map Placeholder</h3>
          <p className="text-gray-400">
            This is a placeholder for the {map.name} map from {game.name}.
            <br />
            Map content will be added here in the future.
          </p>
        </div>
      </div>
    </>
  );
}
