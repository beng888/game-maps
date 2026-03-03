import { db } from "@/db";
import { games, maps } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allGames = await db.select().from(games);
    const allMaps = await db.select().from(maps);

    return NextResponse.json({
      games: allGames,
      maps: allMaps,
      gameCount: allGames.length,
      mapCount: allMaps.length,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
}
