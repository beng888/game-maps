"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MapView from "./MapView";
import MapSelector from "./MapSelector";
import CharacterSelector from "./CharacterSelector";
import CategoryFilter from "./CategoryFilter";

interface MapViewWrapperProps {
  mapData: any;
  gameSlug: string;
  gameBounds: [number, number, number, number] | null;
  tileBaseUrl: string;
  mapSlug: string;
  tilePath: string;
  mapCenter: [number, number] | null;
  mapZoom: number;
  mapId: number;
  gameId: number;
  gameMaps: any[];
  initialLocationId?: string;
}

export default function MapViewWrapper({
  mapData,
  gameSlug,
  gameBounds,
  tileBaseUrl,
  mapSlug,
  tilePath,
  mapCenter,
  mapZoom,
  mapId,
  gameId,
  gameMaps,
  initialLocationId,
}: MapViewWrapperProps) {
  const router = useRouter();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [foundLocations, setFoundLocations] = useState<Set<string>>(new Set());
  const [enabledCategories, setEnabledCategories] = useState<Set<number>>(new Set());

  const handleNavigateToMap = (targetMapSlug: string, locationId?: string) => {
    const url = locationId
      ? `/${gameSlug}/${targetMapSlug}?locationIds=${locationId}`
      : `/${gameSlug}/${targetMapSlug}`;
    router.push(url);
  };

  const handleFoundToggle = async (locationId: string, found: boolean) => {
    if (!selectedCharacterId) return;

    // Update local state (this won't rerender the map because we use direct DOM manipulation)
    setFoundLocations((prev) => {
      const newSet = new Set(prev);
      if (found) {
        newSet.add(locationId);
      } else {
        newSet.delete(locationId);
      }
      return newSet;
    });

    // Save to database
    try {
      await fetch(`/api/characters/${selectedCharacterId}/found`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: parseInt(locationId),
          mapId,
          found,
        }),
      });
    } catch (error) {
      console.error("Failed to save found status:", error);
      // Revert on error
      setFoundLocations((prev) => {
        const newSet = new Set(prev);
        if (!found) {
          newSet.add(locationId);
        } else {
          newSet.delete(locationId);
        }
        return newSet;
      });
    }
  };

  return (
    <>
      {/* Top toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white shadow-sm overflow-visible text-gray-700">
        <div className="p-2 min-w-max md:min-w-0">
          <div className="flex flex-nowrap md:flex-wrap items-center gap-4">
            <MapSelector gameSlug={gameSlug} currentMapSlug={mapSlug} maps={gameMaps} />

            <div className="border-l h-6 border-gray-300"></div>

            <div className="flex items-center gap-2">
              <CharacterSelector
                gameId={gameId}
                currentMapId={mapId}
                onCharacterSelect={setSelectedCharacterId}
                onFoundLocationsLoad={setFoundLocations}
              />
            </div>

            <div className="border-l h-6 border-gray-300"></div>

            <div className="flex items-center gap-2">
              <CategoryFilter
                groups={mapData?.groups || []}
                onFilterChange={setEnabledCategories}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapView
        mapData={mapData}
        gameSlug={gameSlug}
        gameBounds={gameBounds}
        tileBaseUrl={tileBaseUrl}
        mapSlug={mapSlug}
        tilePath={tilePath}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        mapId={mapId}
        initialLocationId={initialLocationId}
        foundLocations={foundLocations}
        selectedCharacterId={selectedCharacterId}
        enabledCategories={enabledCategories}
        onFoundToggle={handleFoundToggle}
        onNavigateToMap={handleNavigateToMap}
      />
    </>
  );
}
