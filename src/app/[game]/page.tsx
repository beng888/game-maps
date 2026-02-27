import { db } from "@/db";
import { games, maps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";

interface GamePageProps {
  params: Promise<{
    game: string;
  }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { game } = await params;

  const [gameData] = await db.select().from(games).where(eq(games.slug, game)).limit(1);

  if (!gameData) {
    notFound();
  }

  const gameMaps = await db.select().from(maps).where(eq(maps.gameId, gameData.id));

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-2">{gameData.name}</h1>
        <p className="text-gray-600 mb-6">Select a map to view</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameMaps.map((map) => (
            <Link
              key={map.id}
              href={`/${gameData.slug}/${map.slug}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold">{map.name}</h2>
              {map.description && <p className="text-gray-600 mt-2">{map.description}</p>}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
