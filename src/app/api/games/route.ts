import { db } from "@/db";
import { games } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const allGames = await db.select().from(games);
  return NextResponse.json(allGames);
}
