"use client";

import { useState, useEffect } from "react";

interface MapDisplayProps {
  gameSlug: string;
  mapSlug: string;
}

interface MapData {
  maps: Array<{ id: number; title: string; slug: string }>;
  map: { id: number; title: string; slug: string };
  groups: Array<{
    id: number;
    title: string;
    categories: Array<{
      id: number;
      title: string;
      icon: string;
      template: string | null;
    }>;
  }>;
  locations: Array<{
    id: number;
    title: string;
    description: string | null;
    category_id: number;
    latitude: string;
    longitude: string;
  }>;
  regions: Array<{
    id: number;
    title: string;
    features: Array<{
      geometry: {
        coordinates: number[][][];
        type: string;
      };
    }>;
  }>;
}

export default function MapDisplay({ gameSlug, mapSlug }: MapDisplayProps) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMapData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/maps/${gameSlug}/${mapSlug}`);

        if (!response.ok) {
          throw new Error("Failed to fetch map data");
        }

        const data = await response.json();
        setMapData(data.mapData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchMapData();
  }, [gameSlug, mapSlug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading map data...</div>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error || "No map data available"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">{mapData.map.title}</h2>
        <p className="text-gray-600">
          {mapData.locations.length} locations • {mapData.groups.length} categories
        </p>
      </div>

      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mapData.groups.map((group) => (
            <div key={group.id} className="border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-2">{group.title}</h4>
              <div className="space-y-1">
                {group.categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 bg-gray-200 rounded"></span>
                    <span>{category.title}</span>
                    <span className="text-gray-400 text-xs">
                      ({mapData.locations.filter((l) => l.category_id === category.id).length})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regions Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Regions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mapData.regions.map((region) => (
            <div key={region.id} className="border rounded-lg p-4">
              <h4 className="font-semibold">{region.title}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Locations Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Locations</h3>
        <div className="space-y-3">
          {mapData.locations.slice(0, 10).map((location) => (
            <div key={location.id} className="border-b pb-2 last:border-0">
              <h4 className="font-medium">{location.title}</h4>
              {location.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {location.description.replace(/<[^>]*>/g, "")}
                </p>
              )}
            </div>
          ))}
        </div>
        {mapData.locations.length > 10 && (
          <p className="text-sm text-gray-500 mt-4">
            + {mapData.locations.length - 10} more locations
          </p>
        )}
      </div>
    </div>
  );
}
