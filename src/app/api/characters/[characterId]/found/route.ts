import { db } from "@/db";
import { characters, foundLocations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> },
) {
  const { characterId } = await params;
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user from the database using email
  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Verify character belongs to user
  const [char] = await db
    .select()
    .from(characters)
    .where(and(eq(characters.id, parseInt(characterId)), eq(characters.userId, user.id)));

  if (!char) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const found = await db
    .select()
    .from(foundLocations)
    .where(eq(foundLocations.characterId, parseInt(characterId)));

  return NextResponse.json(found);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> },
) {
  try {
    const { characterId } = await params;
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database using email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { locationId, mapId, found } = await request.json();

    // Verify character belongs to user
    const [char] = await db
      .select()
      .from(characters)
      .where(and(eq(characters.id, parseInt(characterId)), eq(characters.userId, user.id)));

    if (!char) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    console.log("Updating found status:", { characterId, locationId, mapId, found });

    if (found) {
      // Add found location
      await db
        .insert(foundLocations)
        .values({
          characterId: parseInt(characterId),
          locationId: parseInt(locationId),
          mapId,
        })
        .onConflictDoNothing();
    } else {
      // Remove found location
      await db
        .delete(foundLocations)
        .where(
          and(
            eq(foundLocations.characterId, parseInt(characterId)),
            eq(foundLocations.locationId, parseInt(locationId)),
            eq(foundLocations.mapId, mapId),
          ),
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /found:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
