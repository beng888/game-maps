import { db } from "@/db";
import { characters, foundLocations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(
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

  // Verify character belongs to user and delete it (cascade will delete foundLocations)
  const [deletedChar] = await db
    .delete(characters)
    .where(and(eq(characters.id, parseInt(characterId)), eq(characters.userId, user.id)))
    .returning();

  if (!deletedChar) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
