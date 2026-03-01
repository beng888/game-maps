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
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700 mr-2">Select map:</span>
      <div className="flex flex-wrap gap-2">
        {maps.map((map) => (
          <Link
            key={map.id}
            href={`/${gameSlug}/${map.slug}`}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              map.slug === currentMapSlug
                ? "bg-blue-500 text-white cursor-default"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
