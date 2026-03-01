"use client";

import { useRouter } from "next/navigation";
import MapView from "./MapView";

interface MapViewWrapperProps {
  mapData: any;
  gameSlug: string;
  mapSlug: string;
  initialLocationId?: string;
}

export default function MapViewWrapper({
  mapData,
  gameSlug,
  mapSlug,
  initialLocationId,
}: MapViewWrapperProps) {
  const router = useRouter();

  const handleNavigateToMap = (targetMapSlug: string, locationId?: string) => {
    const url = locationId
      ? `/${gameSlug}/${targetMapSlug}?locationIds=${locationId}`
      : `/${gameSlug}/${targetMapSlug}`;
    router.push(url);
  };

  return (
    <MapView
      mapData={mapData}
      gameSlug={gameSlug}
      mapSlug={mapSlug}
      initialLocationId={initialLocationId}
      onNavigateToMap={handleNavigateToMap}
    />
  );
}
