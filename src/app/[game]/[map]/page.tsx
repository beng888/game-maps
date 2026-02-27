import { db } from "@/db";
import { games, maps } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import MapSelector from "@/components/MapSelector";
import MapDisplay from "@/components/MapDisplay";

interface MapPageProps {
  params: Promise<{
    game: string;
    map: string;
  }>;
}

export default async function MapPage({ params }: MapPageProps) {
  // Await the params Promise
  const { game, map } = await params;

  // Get the game
  const [gameData] = await db.select().from(games).where(eq(games.slug, game)).limit(1);

  if (!gameData) {
    notFound();
  }

  // Get the current map
  const [currentMap] = await db
    .select()
    .from(maps)
    .where(and(eq(maps.gameId, gameData.id), eq(maps.slug, map)))
    .limit(1);

  if (!currentMap) {
    notFound();
  }

  // Get all maps for this game for the selector
  const gameMaps = await db.select().from(maps).where(eq(maps.gameId, gameData.id));

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm">
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/${gameData.slug}`} className="text-blue-500 hover:text-blue-700">
            {gameData.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{currentMap.name}</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">{currentMap.name}</h1>
        {currentMap.description && <p className="text-gray-600 mb-6">{currentMap.description}</p>}

        {/* Map Selector Component */}
        <MapSelector gameSlug={gameData.slug} currentMapSlug={currentMap.slug} maps={gameMaps} />

        {/* Map Display Component */}
        <div className="mt-8">
          <MapDisplay gameSlug={gameData.slug} mapSlug={currentMap.slug} />
        </div>
      </div>
    </>
  );
}
