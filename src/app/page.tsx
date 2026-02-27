"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import NavBar from "@/components/NavBar";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/games");
    }
  }, [status, router]);

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
