"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";

interface Game {
  id: number;
  name: string;
  slug: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (status === "unauthenticated" && process.env.NODE_ENV !== "development") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchGames() {
      const response = await fetch("/api/games");
      const data = await response.json();
      setGames(data);
    }
    fetchGames();
  }, []);

  if (status === "loading") {
    return (
      <>
        <NavBar />
        <div className="container mx-auto p-4">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  if (!session || process.env.NODE_ENV === "development") {
    return (
      <>
        <NavBar />
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-4">Welcome to Game Maps</h1>
          <p>Please sign in to continue.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Select a Game</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/${game.slug}/${game.slug === "fallout-new-vegas" ? "mojave-wasteland" : ""}`}
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
