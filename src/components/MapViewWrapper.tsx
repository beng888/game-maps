"use client";

import { useState, useRef, useEffect } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Use a ref to always have the latest value
  const selectedCharacterIdRef = useRef(selectedCharacterId);

  // Update the ref whenever selectedCharacterId changes
  useEffect(() => {
    console.log("selectedCharacterId changed:", selectedCharacterId);
    selectedCharacterIdRef.current = selectedCharacterId;
  }, [selectedCharacterId]);

  const handleNavigateToMap = (targetMapSlug: string, locationId?: string) => {
    const url = locationId
      ? `/${gameSlug}/${targetMapSlug}?locationIds=${locationId}`
      : `/${gameSlug}/${targetMapSlug}`;
    router.push(url);
    // Close menu on mobile after navigation
    setIsMenuOpen(false);
  };

  const handleFoundToggle = async (locationId: string, found: boolean) => {
    // Use the ref instead of the state variable
    const currentCharId = selectedCharacterIdRef.current;
    console.log("handleFoundToggle - currentCharId from ref:", currentCharId);

    if (!currentCharId) {
      console.log("No character selected, ignoring toggle");
      return;
    }

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
      console.log("Saving to database:", { currentCharId, locationId, mapId, found });
      const response = await fetch(`/api/characters/${currentCharId}/found`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: parseInt(locationId),
          mapId,
          found,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      console.log("Successfully saved to database");
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
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="absolute top-2 right-2 z-20 md:hidden bg-white rounded-lg shadow-lg p-2 text-gray-700 hover:bg-gray-50"
        aria-label="Toggle menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>Toggle menu</title>
          {isMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Top toolbar - hidden on mobile by default, shown when menu is open */}
      <div
        className={`
          absolute p-4 top-0 left-0 right-0 z-10 bg-white shadow-lg
          transition-all duration-300 ease-in-out
          md:translate-y-0 md:opacity-100
          ${isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
          md:p-2 md:shadow-sm overflow-visible text-gray-700
        `}
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-4 md:items-center max-w-screen">
          <CharacterSelector
            gameId={gameId}
            currentMapId={mapId}
            onCharacterSelect={setSelectedCharacterId}
            onFoundLocationsLoad={setFoundLocations}
          />

          <div className="md:ml-auto flex items-center gap-1">
            <CategoryFilter groups={mapData?.groups || []} onFilterChange={setEnabledCategories} />
            <MapSelector gameSlug={gameSlug} currentMapSlug={mapSlug} maps={gameMaps} />
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
