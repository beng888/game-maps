"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { categoryIcons, defaultIcon } from "@/lib/categoryIcons";

interface MapViewProps {
  mapData: any;
  gameSlug: string;
  gameBounds: [number, number, number, number] | null;
  tileBaseUrl: string;
  mapSlug: string;
  tilePath: string;
  mapCenter: [number, number] | null;
  mapZoom: number;
  mapId: number;
  initialLocationId?: string;
  foundLocations?: Set<string>;
  selectedCharacterId?: number | null;
  enabledCategories?: Set<number>;
  onFoundToggle?: (locationId: string, found: boolean) => void;
  onNavigateToMap?: (targetMapSlug: string, locationId?: string) => void;
  showOnlyUndiscovered?: boolean;
}

export default function MapView({
  mapData,
  gameSlug,
  gameBounds,
  tileBaseUrl,
  mapSlug,
  tilePath,
  mapCenter,
  mapZoom,
  mapId,
  initialLocationId,
  foundLocations = new Set(),
  selectedCharacterId,
  enabledCategories = new Set(),
  onFoundToggle,
  onNavigateToMap,
  showOnlyUndiscovered,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; element: HTMLElement }>>(
    new Map(),
  );
  const initialLocationHandled = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const selectedCharacterIdRef = useRef(selectedCharacterId);
  const onFoundToggleRef = useRef(onFoundToggle);
  const foundLocationsRef = useRef(foundLocations);

  // Update refs when props change
  useEffect(() => {
    selectedCharacterIdRef.current = selectedCharacterId;
  }, [selectedCharacterId]);

  useEffect(() => {
    onFoundToggleRef.current = onFoundToggle;
  }, [onFoundToggle]);

  useEffect(() => {
    foundLocationsRef.current = foundLocations;
  }, [foundLocations]);

  // Single effect to update marker opacity when foundLocations changes
  useEffect(() => {
    if (!mapReady || markersRef.current.size === 0) {
      console.log("Map not ready or no markers yet, skipping opacity update");
      return;
    }

    console.log("Updating marker opacity for", foundLocations.size, "found locations");
    let updatedCount = 0;
    markersRef.current.forEach(({ element }, locationId) => {
      if (foundLocations.has(locationId)) {
        if (!element.classList.contains("found")) {
          element.classList.add("found");
          updatedCount++;
        }
      } else {
        if (element.classList.contains("found")) {
          element.classList.remove("found");
          updatedCount++;
        }
      }
    });
    console.log(`Updated ${updatedCount} markers`);
  }, [foundLocations, mapReady]);

  // Update marker visibility when enabledCategories changes
  useEffect(() => {
    if (!mapReady || markersRef.current.size === 0) return;

    markersRef.current.forEach(({ element }, locationId) => {
      const location = mapData.locations.find((l: any) => l.id.toString() === locationId);
      if (location) {
        const shouldShow =
          enabledCategories.size === 0 || enabledCategories.has(location.category_id);
        element.style.display = shouldShow ? "flex" : "none";
      }
    });
  }, [enabledCategories, mapData.locations, mapReady]);

  // Helper to get tile URL
  const getTileUrl = useCallback(() => {
    return `${tileBaseUrl}/${tilePath}/{z}/{y}/{x}.jpg`;
  }, [tileBaseUrl, tilePath]);

  // Helper to get map bounds
  const getMapBounds = useCallback(() => {
    return gameBounds || [-1.4, 0, 0, 1.4];
  }, [gameBounds]);

  // Helper to get map center
  const getMapCenter = useCallback(() => {
    return mapCenter || [-0.8, 0.7];
  }, [mapCenter]);

  // Helper to focus on a location
  const focusOnLocation = useCallback(
    (locationId: string) => {
      if (!map.current) return;

      const targetLocation = mapData.locations.find((loc: any) => loc.id.toString() === locationId);

      if (targetLocation) {
        const lng = parseFloat(targetLocation.longitude);
        const lat = parseFloat(targetLocation.latitude);

        if (popup.current) popup.current.remove();

        map.current.jumpTo({
          center: [lng, lat],
          zoom: 13,
        });

        const markerData = markersRef.current.get(locationId);
        if (markerData) {
          markerData.element.click();
        }
      }
    },
    [mapData],
  );

  // Helper to handle internal links
  const handleInternalLink = useCallback(
    (e: MouseEvent, href: string) => {
      e.preventDefault();

      try {
        const url = new URL(href);
        const pathParts = url.pathname.split("/").filter(Boolean);
        const locationId = url.searchParams.get("locationIds");

        console.log("Internal link clicked:", { pathParts, locationId });

        if (pathParts.length >= 3 && pathParts[1] === "maps") {
          const targetMapSlug = pathParts[2];
          // Navigate to different map with locationId
          if (onNavigateToMap) {
            onNavigateToMap(targetMapSlug, locationId || undefined);
          }
          return;
        }

        // Same map location link
        if (locationId && map.current) {
          console.log("📍 Focusing on same-map location:", locationId);
          // Just focus on the location without changing URL
          focusOnLocation(locationId);

          // Optional: Update URL to reflect locationId without reload
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set("locationIds", locationId);
          window.history.pushState({}, "", newUrl);
        }
      } catch (error) {
        console.error("Error handling internal link:", error);
      }
    },
    [onNavigateToMap, focusOnLocation],
  );

  useEffect(() => {
    if (!mapReady || !initialLocationId || !map.current) {
      console.log("Map not ready or no locationId, skipping focus");
      return;
    }

    console.log("📍 URL locationId changed, focusing on:", initialLocationId);

    // Small delay to ensure map is stable
    setTimeout(() => {
      focusOnLocation(initialLocationId);
    }, 500);
  }, [initialLocationId, mapReady, focusOnLocation]);

  useEffect(() => {
    if (!mapReady || markersRef.current.size === 0) return;

    console.log("Updating marker visibility:", {
      enabledCategories: enabledCategories.size,
      showOnlyUndiscovered,
      foundLocations: foundLocations.size,
    });

    markersRef.current.forEach(({ element }, locationId) => {
      const location = mapData.locations.find((l: any) => l.id.toString() === locationId);
      if (!location) return;

      // Check category filter
      const passesCategoryFilter =
        enabledCategories.size === 0 || enabledCategories.has(location.category_id);

      // Check undiscovered filter (if enabled)
      const isFound = foundLocations.has(locationId);
      const passesUndiscoveredFilter = !showOnlyUndiscovered || !isFound;

      // Show marker only if it passes BOTH filters
      const shouldShow = passesCategoryFilter && passesUndiscoveredFilter;

      element.style.display = shouldShow ? "flex" : "none";
    });
  }, [enabledCategories, showOnlyUndiscovered, foundLocations, mapData.locations, mapReady]);

  // Initialize map
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log("Initializing map...");
    const bounds = getMapBounds();
    const center = getMapCenter();

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: [getTileUrl()],
            tileSize: 256,
            minzoom: 8,
            maxzoom: 15,
            bounds: bounds,
          },
        },
        layers: [
          {
            id: "tiles",
            type: "raster",
            source: "raster-tiles",
          },
        ],
      },
      maxBounds: bounds,
      center: center,
      zoom: mapZoom,
      maxZoom: 15,
      minZoom: 8,
      renderWorldCopies: false,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Suppress 403 errors
    map.current.on("error", (e) => {
      if (e.error && e.error.status === 403) {
        e.preventDefault?.();
      }
    });

    map.current.on("load", () => {
      if (!map.current) return;

      console.log("Map loaded, adding markers...");
      markersRef.current.clear();

      mapData.locations.forEach((location: any) => {
        const icon = categoryIcons[location.category_id] || defaultIcon;
        const lng = parseFloat(location.longitude);
        const lat = parseFloat(location.latitude);
        const locationId = location.id.toString();
        // Use the ref to get the latest foundLocations
        const isFound = foundLocationsRef.current.has(locationId);
        const shouldShow =
          enabledCategories.size === 0 || enabledCategories.has(location.category_id);

        const el = document.createElement("div");
        el.className = `map-marker ${isFound ? "found" : ""}`;
        el.innerHTML = icon;
        el.style.display = shouldShow ? "flex" : "none";

        el.dataset.id = locationId;
        el.dataset.title = location.title;
        el.dataset.lng = lng.toString();
        el.dataset.lat = lat.toString();
        el.dataset.desc = location.description || "";
        el.dataset.category = location.category_id;

        if (location.media?.length > 0) {
          el.dataset.media = JSON.stringify(location.media.map((m: any) => m.url));
        }

        el.onclick = (e) => {
          e.stopPropagation();
          const target = e.currentTarget as HTMLElement;

          if (popup.current) popup.current.remove();

          const title = target.dataset.title || "";
          const desc = target.dataset.desc || "";
          const media = target.dataset.media;
          const categoryId = parseInt(target.dataset.category || "0");
          const category = mapData.categories[categoryId];
          const locationId = target.dataset.id || "";
          // Use the refs to get current values
          const currentFound = foundLocationsRef.current.has(locationId);
          const hasSelectedChar = selectedCharacterIdRef.current !== null;

          console.log(
            "Popup opened - hasSelectedChar:",
            hasSelectedChar,
            "selectedCharacterId:",
            selectedCharacterIdRef.current,
            "currentFound:",
            currentFound,
          );

          const formatDescription = (text: string) => {
            let formatted = text.replace(
              /\[([^\]]+)\]\(https:\/\/mapgenie\.io([^)]+)\)/g,
              (match, linkText, urlPath) => {
                return `<a href="#" class="internal-link" data-href="https://mapgenie.io${urlPath}">${linkText}</a>`;
              },
            );

            formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            formatted = formatted.replace(/\n/g, "<br/>");

            return formatted;
          };

          let html = `
            <div class="location-popup">
              <h3 class="popup-title">${title}</h3>
          `;

          if (desc) {
            html += `<div class="popup-description">${formatDescription(desc)}</div>`;
          }

          if (media) {
            const images = JSON.parse(media);
            if (images.length > 0) {
              html += '<div class="popup-images">';
              images.forEach((url: string) => {
                html += `<img src="${url}" alt="${title}" class="popup-image" loading="lazy" />`;
              });
              html += "</div>";
            }
          }

          // Add found checkbox if character is selected
          if (hasSelectedChar && onFoundToggleRef.current) {
            console.log("Adding checkbox for location:", locationId, "currentFound:", currentFound);
            html += `
              <div class="popup-found">
                <label class="found-checkbox">
                  <input type="checkbox" ${currentFound ? "checked" : ""} data-location-id="${locationId}" />
                  <span>Found</span>
                </label>
              </div>
            `;
          } else if (category) {
            html += `
              <div class="popup-category">
                <span>${categoryIcons[categoryId] || "📍"}</span>
                <span>${category.title}</span>
              </div>
            `;
          }

          html += "</div>";

          popup.current = new maplibregl.Popup({
            offset: 25,
            maxWidth: "500px",
            closeButton: true,
            closeOnClick: true,
          })
            .setLngLat([lng, lat])
            .setHTML(html)
            .addTo(map.current!);

          // Add checkbox handler
          if (hasSelectedChar && onFoundToggleRef.current) {
            const checkbox = document.querySelector(`.found-checkbox input`);
            if (checkbox) {
              checkbox.addEventListener("change", (e) => {
                e.stopPropagation();
                const input = e.target as HTMLInputElement;
                const newFound = input.checked;

                console.log("Checkbox toggled:", locationId, newFound);

                // Update marker class immediately
                target.classList.toggle("found", newFound);

                // Call the toggle handler (updates DB)
                onFoundToggleRef.current?.(locationId, newFound);

                // Also save to localStorage as backup
                if (selectedCharacterIdRef.current) {
                  // This will be handled by the onFoundToggle which should update localStorage
                }
              });
            }
          }

          // Add link handlers
          const links = document.querySelectorAll(".internal-link");
          links.forEach((link) => {
            link.addEventListener("click", (e) => {
              e.preventDefault();
              const href = (e.currentTarget as HTMLAnchorElement).getAttribute("data-href");
              if (href) handleInternalLink(e as MouseEvent, href);
            });
          });
        };

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        markersRef.current.set(locationId, { marker, element: el });
      });

      setMapReady(true);

      // Handle initial location if provided
      if (initialLocationId && !initialLocationHandled.current) {
        setTimeout(() => {
          focusOnLocation(initialLocationId);
          initialLocationHandled.current = true;
        }, 500);
      }
    });

    return () => {
      if (popup.current) popup.current.remove();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      markersRef.current.clear();
      setMapReady(false);
      initialLocationHandled.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
}
