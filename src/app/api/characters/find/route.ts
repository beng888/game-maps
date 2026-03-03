import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name");
    const gameId = searchParams.get("gameId");

    if (!name || !gameId) {
      return NextResponse.json({ error: "Missing name or gameId" }, { status: 400 });
    }

    const character = await db.query.characters.findFirst({
      where: and(
        eq(characters.name, name),
        eq(characters.gameId, parseInt(gameId)),
        eq(characters.userId, session.user.email),
      ),
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("Error finding character:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
