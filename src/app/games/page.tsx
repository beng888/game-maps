import { db } from "@/db";
import { games } from "@/db/schema";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export default async function GamesPage() {
  const allGames = await db.select().from(games);

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Select a Game</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allGames.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold">{game.name}</h2>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
