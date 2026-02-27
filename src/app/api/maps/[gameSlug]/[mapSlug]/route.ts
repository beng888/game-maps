import { db } from "@/db";
import { games, maps } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameSlug: string; mapSlug: string }> },
) {
  try {
    // Await the params
    const { gameSlug, mapSlug } = await params;

    // Get the game
    const [game] = await db.select().from(games).where(eq(games.slug, gameSlug)).limit(1);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get the map with its data
    const [map] = await db
      .select()
      .from(maps)
      .where(and(eq(maps.gameId, game.id), eq(maps.slug, mapSlug)))
      .limit(1);

    if (!map) {
      return NextResponse.json({ error: "Map not found" }, { status: 404 });
    }

    // Parse the mapData if it exists
    const mapData = map.mapData ? JSON.parse(map.mapData) : null;

    return NextResponse.json({
      ...map,
      mapData,
    });
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 });
  }
}
