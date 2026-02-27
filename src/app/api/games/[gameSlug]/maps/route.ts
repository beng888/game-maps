import { db } from "@/db";
import { games, maps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  const [game] = await db.select().from(games).where(eq(games.slug, gameSlug)).limit(1);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const gameMaps = await db.select().from(maps).where(eq(maps.gameId, game.id));

  return NextResponse.json(gameMaps);
}
