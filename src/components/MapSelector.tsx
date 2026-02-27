"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Map {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface MapSelectorProps {
  gameSlug: string;
  currentMapSlug: string;
  maps: Map[];
}

export default function MapSelector({ gameSlug, currentMapSlug, maps }: MapSelectorProps) {
  const pathname = usePathname();

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Select a different map:</h2>
      <div className="flex flex-wrap gap-2">
        {maps.map((map) => (
          <Link
            key={map.id}
            href={`/${gameSlug}/${map.slug}`}
            className={`px-4 py-2 rounded transition-colors ${
              map.slug === currentMapSlug
                ? "bg-blue-500 text-white cursor-default"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
            aria-current={map.slug === currentMapSlug ? "page" : undefined}
          >
            {map.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
