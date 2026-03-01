import { db } from "@/db";
import { games, maps } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import MapSelector from "@/components/MapSelector";
import MapViewWrapper from "@/components/MapViewWrapper";

interface MapPageProps {
  params: Promise<{
    game: string;
    map: string;
  }>;
  searchParams?: Promise<{
    locationIds?: string;
  }>;
}

export default async function MapPage({ params, searchParams }: MapPageProps) {
  const { game, map } = await params;
  const resolvedSearchParams = await searchParams;
  const locationId = resolvedSearchParams?.locationIds;

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

  // Parse map data
  const mapData = currentMap.mapData ? JSON.parse(currentMap.mapData) : null;

  return (
    <div className="h-screen flex flex-col">
      <NavBar />
      <div className="bg-white shadow-sm z-10">
        <div className="container mx-auto p-2">
          <MapSelector gameSlug={gameData.slug} currentMapSlug={currentMap.slug} maps={gameMaps} />
        </div>
      </div>
      <div className="flex-1 relative">
        {mapData ? (
          <MapViewWrapper
            mapData={mapData}
            gameSlug={gameData.slug}
            mapSlug={currentMap.slug}
            initialLocationId={locationId}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No map data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
