"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { categoryIcons, defaultIcon } from "@/lib/categoryIcons";

interface MapViewProps {
  mapData: any;
  gameSlug: string;
  mapSlug: string;
  mapId: number;
  initialLocationId?: string;
  foundLocations?: Set<string>;
  selectedCharacterId?: number | null;
  enabledCategories?: Set<number>;
  onFoundToggle?: (locationId: string, found: boolean) => void;
  onNavigateToMap?: (targetMapSlug: string, locationId?: string) => void;
}

export default function MapView({
  mapData,
  gameSlug,
  mapSlug,
  mapId,
  initialLocationId,
  foundLocations = new Set(),
  selectedCharacterId,
  enabledCategories = new Set(),
  onFoundToggle,
  onNavigateToMap,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; element: HTMLElement }>>(
    new Map(),
  );
  const initialLocationHandled = useRef(false);
  const selectedCharacterIdRef = useRef(selectedCharacterId);

  useEffect(() => {
    selectedCharacterIdRef.current = selectedCharacterId;
  }, [selectedCharacterId]);

  // Helper to focus on a location instantly
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

        if (pathParts.length >= 3 && pathParts[1] === "maps") {
          const targetMapSlug = pathParts[2];
          if (onNavigateToMap) {
            onNavigateToMap(targetMapSlug, locationId || undefined);
          }
          return;
        }

        if (locationId && map.current) {
          focusOnLocation(locationId);
        }
      } catch (error) {
        console.error("Error handling internal link:", error);
      }
    },
    [onNavigateToMap, focusOnLocation],
  );

  // Update marker visibility when enabledCategories changes
  useEffect(() => {
    if (!map.current || markersRef.current.size === 0) return;

    markersRef.current.forEach(({ marker, element }, locationId) => {
      const location = mapData.locations.find((l: any) => l.id.toString() === locationId);
      if (location) {
        const shouldShow =
          enabledCategories.size === 0 || enabledCategories.has(location.category_id);
        marker.getElement().style.display = shouldShow ? "flex" : "none";
      }
    });
  }, [enabledCategories, mapData.locations]);

  // Update marker opacity when foundLocations changes
  useEffect(() => {
    if (!map.current || markersRef.current.size === 0) return;

    markersRef.current.forEach(({ element }, locationId) => {
      if (foundLocations.has(locationId)) {
        element.classList.add("found");
      } else {
        element.classList.remove("found");
      }
    });
  }, [foundLocations]);

  const getTileUrl = (mapSlug: string) => {
    const tilePaths: Record<string, string> = {
      "mojave-wasteland": "fallout-new-vegas/mojave-wasteland/default-v2",
      "sierra-madre": "fallout-new-vegas/sierra-madre/default-v1",
      "zion-canyon": "fallout-new-vegas/zion-canyon/default-v1",
      "big-mt": "fallout-new-vegas/big-mt/default-v1",
      "the-divide": "fallout-new-vegas/the-divide/default-v1",
    };

    const path = tilePaths[mapSlug];
    if (!path) {
      console.warn(`No tile path found for map: ${mapSlug}, using default`);
      return `https://tiles.mapgenie.io/games/fallout-new-vegas/mojave-wasteland/default-v2/{z}/{y}/{x}.jpg`;
    }

    return `https://tiles.mapgenie.io/games/${path}/{z}/{y}/{x}.jpg`;
  };

  const getMapCenter = (mapSlug: string) => {
    const centers: Record<string, [number, number]> = {
      "mojave-wasteland": [-0.79407843012208, 0.70144020169235],
      "sierra-madre": [-0.8593568483393, 0.71132050351143],
      "zion-canyon": [-0.80437288889794, 0.64827011938249],
      "big-mt": [-0.82521207715246, 0.72249280811974],
      "the-divide": [-0.8043821638268, 0.74278153843068],
    };
    return centers[mapSlug] || centers["mojave-wasteland"];
  };

  const getMapZoom = (mapSlug: string) => {
    const zooms: Record<string, number> = {
      "mojave-wasteland": 11,
      "sierra-madre": 10,
      "zion-canyon": 11,
      "big-mt": 11,
      "the-divide": 12,
    };
    return zooms[mapSlug] || 11;
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const bounds: [number, number, number, number] = [-1.4, 0, 0, 1.4];
    const center = getMapCenter(mapSlug);
    const zoom = getMapZoom(mapSlug);

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: [
              getTileUrl(mapSlug), // Use dynamic function instead of hardcoded URL
            ],
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
      zoom: zoom,
      maxZoom: 15,
      minZoom: 8,
      renderWorldCopies: false,
      preserveDrawingBuffer: true,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("error", (e) => {
      if (e.error && e.error.status === 403) {
        e?.preventDefault?.();
      }
    });

    map.current.on("load", () => {
      if (!map.current) return;

      markersRef.current.clear();

      mapData.locations.forEach((location: any) => {
        const icon = categoryIcons[location.category_id] || defaultIcon;
        const lng = parseFloat(location.longitude);
        const lat = parseFloat(location.latitude);
        const locationId = location.id.toString();
        const isFound = foundLocations.has(locationId);
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

        el.dataset.selectedCharacterId = selectedCharacterId?.toString() || "";

        el.onclick = (e) => {
          e.stopPropagation();
          const target = e.currentTarget as HTMLElement;

          if (popup.current) popup.current.remove();

          const title = target.dataset.title || "";
          const desc = target.dataset.desc || "";
          const media = target.dataset.media;
          const categoryId = parseInt(target.dataset.category || "0");
          const category = mapData.categories[categoryId];
          const currentFound = foundLocations.has(locationId);
          const hasSelectedChar = selectedCharacterIdRef.current !== null;

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
          if (hasSelectedChar && onFoundToggle) {
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
          if (selectedCharacterId && onFoundToggle) {
            const checkbox = document.querySelector(`.found-checkbox input`);
            checkbox?.addEventListener("change", (e) => {
              const input = e.target as HTMLInputElement;
              const newFound = input.checked;

              // Update marker class immediately
              target.classList.toggle("found", newFound);

              // Call the toggle handler (this won't rerender the map now)
              onFoundToggle(locationId, newFound);
            });
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

      // Handle initial location if provided and not yet handled
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
    };
  }, [mapData, gameSlug, mapSlug]); // Only recreate map when these change

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
}
