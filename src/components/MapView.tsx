"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { categoryIcons, defaultIcon } from "@/lib/categoryIcons";

interface MapViewProps {
  mapData: any;
  gameSlug: string;
  mapSlug: string;
  initialLocationId?: string;
  onNavigateToMap?: (targetMapSlug: string, locationId?: string) => void;
}

export default function MapView({
  mapData,
  gameSlug,
  mapSlug,
  initialLocationId,
  onNavigateToMap,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const markersRef = useRef<Map<string, HTMLElement>>(new Map());

  // Helper to focus on a location instantly
  const focusOnLocation = (locationId: string) => {
    if (!map.current) return;

    const targetLocation = mapData.locations.find((loc: any) => loc.id.toString() === locationId);

    if (targetLocation) {
      const lng = parseFloat(targetLocation.longitude);
      const lat = parseFloat(targetLocation.latitude);

      // Close any open popup
      if (popup.current) popup.current.remove();

      // Jump instantly to the location (no animation)
      map.current.jumpTo({
        center: [lng, lat],
        zoom: 13,
      });

      // Click the marker immediately
      const markerEl = markersRef.current.get(locationId);
      if (markerEl) {
        markerEl.click();
      }
    }
  };

  // Helper to handle internal links
  const handleInternalLink = (e: MouseEvent, href: string) => {
    e.preventDefault();

    try {
      const url = new URL(href);
      const pathParts = url.pathname.split("/").filter(Boolean);
      const locationId = url.searchParams.get("locationIds");

      // Check if it's a map link (e.g., /fallout-new-vegas/maps/big-mt)
      if (pathParts.length >= 3 && pathParts[1] === "maps") {
        const targetMapSlug = pathParts[2];
        if (onNavigateToMap) {
          onNavigateToMap(targetMapSlug, locationId || undefined);
        }
        return;
      }

      // Check if it's a location link within same map
      if (locationId && map.current) {
        focusOnLocation(locationId);
      }
    } catch (error) {
      console.error("Error handling internal link:", error);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const bounds: [number, number, number, number] = [-1.4, 0, 0, 1.4];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: [
              `https://tiles.mapgenie.io/games/fallout-new-vegas/mojave-wasteland/default-v2/{z}/{y}/{x}.jpg`,
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
      center: [-0.79407843012208, 0.70144020169235],
      zoom: 11,
      maxZoom: 15,
      minZoom: 8,
      renderWorldCopies: false,
      preserveDrawingBuffer: true,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("error", (e) => {
      if (e.error && e.error.status === 403) {
        e.preventDefault();
      }
    });

    map.current.on("load", () => {
      if (!map.current) return;

      // Clear markers ref
      markersRef.current.clear();

      mapData.locations.forEach((location: any) => {
        const icon = categoryIcons[location.category_id] || defaultIcon;
        const lng = parseFloat(location.longitude);
        const lat = parseFloat(location.latitude);

        const el = document.createElement("div");
        el.className = "map-marker";
        el.innerHTML = icon;

        el.dataset.id = location.id;
        el.dataset.title = location.title;
        el.dataset.lng = lng.toString();
        el.dataset.lat = lat.toString();
        el.dataset.desc = location.description || "";
        el.dataset.category = location.category_id;

        if (location.media?.length > 0) {
          el.dataset.media = JSON.stringify(location.media.map((m: any) => m.url));
        }

        // Store marker reference
        markersRef.current.set(location.id.toString(), el);

        el.onclick = (e) => {
          e.stopPropagation();
          const target = e.currentTarget as HTMLElement;

          if (popup.current) popup.current.remove();

          const title = target.dataset.title || "";
          const desc = target.dataset.desc || "";
          const media = target.dataset.media;
          const categoryId = parseInt(target.dataset.category || "0");
          const category = mapData.categories[categoryId];

          // Format description with proper links
          const formatDescription = (text: string) => {
            // Replace MapGenie URLs with internal links
            let formatted = text.replace(
              /\[([^\]]+)\]\(https:\/\/mapgenie\.io([^)]+)\)/g,
              (match, linkText, urlPath) => {
                return `<a href="#" class="internal-link" data-href="https://mapgenie.io${urlPath}">${linkText}</a>`;
              },
            );

            // Handle bold text
            formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

            // Handle line breaks
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

          if (category) {
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

          // Add click handlers to internal links after popup is created
          const links = document.querySelectorAll(".internal-link");
          links.forEach((link) => {
            link.addEventListener("click", (e) => {
              e.preventDefault();
              const href = (e.currentTarget as HTMLAnchorElement).getAttribute("data-href");
              if (href) handleInternalLink(e as MouseEvent, href);
            });
          });
        };

        new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current!);
      });

      // Handle initial location if provided
      if (initialLocationId) {
        // Find the location and jump to it immediately
        const targetLocation = mapData.locations.find(
          (loc: any) => loc.id.toString() === initialLocationId,
        );

        if (targetLocation) {
          const lng = parseFloat(targetLocation.longitude);
          const lat = parseFloat(targetLocation.latitude);

          // Jump instantly to the location
          map.current.jumpTo({
            center: [lng, lat],
            zoom: 13,
          });

          // Click the marker
          const markerEl = markersRef.current.get(initialLocationId);
          if (markerEl) {
            markerEl.click();
          }
        }
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
  }, [mapData, gameSlug, mapSlug, initialLocationId]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
}
