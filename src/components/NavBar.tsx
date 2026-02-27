"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Game Maps
        </Link>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span>{session.user?.name}</span>
              <button
                type="button"
                onClick={() => signOut()}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google")}
              className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
