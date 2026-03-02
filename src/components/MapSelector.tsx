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
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap hidden md:block">
        Map:
      </span>
      <select
        value={currentMapSlug}
        onChange={(e) => {
          window.location.href = `/${gameSlug}/${e.target.value}`;
        }}
        className="px-2 py-1 text-sm border rounded-md bg-white min-w-[120px]"
      >
        {maps.map((map) => (
          <option key={map.id} value={map.slug}>
            {map.name}
          </option>
        ))}
      </select>
    </div>
  );
}
