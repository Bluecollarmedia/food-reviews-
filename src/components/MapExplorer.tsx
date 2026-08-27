"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapSpot = {
  slug: string;
  title: string;
  store: string;
  city: string;
  rating: number;
  lat: number;
  lng: number;
  thumbnailUrl: string | null;
};

function scoreText(rating: number) {
  return Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);
}

// A photo marker: the review thumbnail in a rounded tile with a little pointer,
// plus the score in the corner. Falls back to a red pin when there's no image.
function markerHtml(spot: MapSpot) {
  const img = spot.thumbnailUrl
    ? `<span class="dsm-img" style="background-image:url('${spot.thumbnailUrl.replace(/'/g, "%27")}')"></span>`
    : `<span class="dsm-img dsm-img--empty"></span>`;
  return `
    <span class="dsm">
      ${img}
      <span class="dsm-score">${scoreText(spot.rating)}</span>
    </span>`;
}

export default function MapExplorer({ spots }: { spots: MapSpot[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseRef = useRef<L.TileLayer | null>(null);
  const labelRef = useRef<L.TileLayer | null>(null);
  const [satellite, setSatellite] = useState(false);

  // Lock the page so pinch-zoom / drags stay in the map and don't scroll the
  // body (which was making the iOS toolbar pop up and the layout jump).
  useEffect(() => {
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    const prevOver = html.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
      html.style.overscrollBehavior = prevOver;
    };
  }, []);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;

    const map = L.map(elRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });
    mapRef.current = map;

    const markers: L.Marker[] = [];
    for (const spot of spots) {
      const icon = L.divIcon({
        className: "dsm-wrap",
        html: markerHtml(spot),
        iconSize: [52, 60],
        iconAnchor: [26, 60],
        popupAnchor: [0, -58],
      });
      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(map);
      marker.bindPopup(
        `<a class="dsm-pop" href="/videos/${spot.slug}">
           ${spot.thumbnailUrl ? `<img src="${spot.thumbnailUrl}" alt="" />` : ""}
           <span class="dsm-pop-body">
             <strong>${spot.title.replace(/</g, "&lt;")}</strong>
             <span class="dsm-pop-meta">${spot.store.replace(/</g, "&lt;")} · ${spot.city.replace(/</g, "&lt;")}</span>
             <span class="dsm-pop-cta">Watch review →</span>
           </span>
         </a>`,
        { closeButton: true, minWidth: 200 }
      );
      markers.push(marker);
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 14 });
    } else {
      map.setView([40.09, -74.22], 9); // Lakewood / central NJ default
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [spots]);

  // Base tiles — swaps between the clean street map and satellite imagery.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (baseRef.current) map.removeLayer(baseRef.current);
    if (labelRef.current) {
      map.removeLayer(labelRef.current);
      labelRef.current = null;
    }
    if (satellite) {
      baseRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Imagery &copy; Esri" }
      ).addTo(map);
      // Keep place / road labels readable over the imagery.
      labelRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
        { maxZoom: 20, subdomains: "abcd", attribution: "&copy; CARTO" }
      ).addTo(map);
    } else {
      baseRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 20, subdomains: "abcd", attribution: "&copy; OpenStreetMap &copy; CARTO" }
      ).addTo(map);
    }
  }, [satellite]);

  return (
    <>
      <div ref={elRef} className="h-full w-full" />

      {/* Map / Satellite toggle. */}
      <button
        type="button"
        onClick={() => setSatellite((s) => !s)}
        className="absolute right-3 top-3 z-[500] flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-sm font-bold text-foreground shadow-md backdrop-blur active:scale-95"
      >
        {satellite ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 3v15M15 6v15" strokeLinecap="round" />
            </svg>
            Map
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" strokeLinecap="round" />
            </svg>
            Satellite
          </>
        )}
      </button>
      <style>{`
        .dsm-wrap { background: transparent; border: 0; }
        .dsm { position: relative; display: block; width: 52px; height: 60px; }
        .dsm-img {
          position: absolute; top: 0; left: 2px; width: 48px; height: 48px;
          border-radius: 12px; background-size: cover; background-position: center;
          border: 3px solid #fff; box-shadow: 0 3px 8px rgba(0,0,0,.35);
          background-color: #c8102e;
        }
        .dsm-img--empty { background-image: radial-gradient(circle at 30% 25%, #ef4459, #8c0b20); }
        .dsm::after {
          content: ""; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
          width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent;
          border-top: 9px solid #fff;
          filter: drop-shadow(0 2px 1px rgba(0,0,0,.25));
        }
        .dsm-score {
          position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px;
          padding: 0 4px; border-radius: 999px; background: #f59e0b; color: #fff;
          font-size: 11px; font-weight: 800; line-height: 20px; text-align: center;
          border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3);
        }
        .leaflet-popup-content { margin: 0; }
        .leaflet-popup-content-wrapper { border-radius: 14px; overflow: hidden; padding: 0; }
        .dsm-pop { display: flex; gap: 10px; align-items: center; text-decoration: none; color: #221d19; padding: 8px; width: 220px; }
        .dsm-pop img { width: 74px; height: 48px; object-fit: cover; border-radius: 8px; flex: 0 0 auto; }
        .dsm-pop-body { display: flex; flex-direction: column; min-width: 0; }
        .dsm-pop-body strong { font-size: 13px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .dsm-pop-meta { font-size: 11px; color: #6f645b; margin-top: 2px; }
        .dsm-pop-cta { font-size: 11px; font-weight: 700; color: #c8102e; margin-top: 4px; }
      `}</style>
    </>
  );
}
