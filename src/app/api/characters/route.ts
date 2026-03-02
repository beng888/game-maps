import { db } from "@/db";
import { characters, foundLocations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user from the database using email
  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userChars = await db.select().from(characters).where(eq(characters.userId, user.id));

  return NextResponse.json(userChars);
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user from the database using email
  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { gameId, name } = await request.json();

  const [newChar] = await db
    .insert(characters)
    .values({
      userId: user.id, // Use the user's UUID, not email
      gameId,
      name,
    })
    .returning();

  return NextResponse.json(newChar);
}
