"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  lat?: number;
  lng?: number;
  address?: string;
  onChange: (v: { lat?: number; lng?: number; address?: string }) => void;
};

// Pull coordinates straight out of a pasted Google Maps URL (or plain
// "lat, lng" text). Covers the common link shapes; short goo.gl links can't be
// resolved in the browser, so those fall through to address search.
function parseCoords(input: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

export default function LocationPicker({ lat, lng, address, onChange }: Props) {
  const [query, setQuery] = useState(address ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialise the mini-map once.
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const start: [number, number] =
      typeof lat === "number" && typeof lng === "number" ? [lat, lng] : [40.09, -74.22];
    const map = L.map(elRef.current, { zoomControl: true }).setView(
      start,
      typeof lat === "number" ? 15 : 9
    );
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const marker = L.marker(start, { draggable: true, opacity: typeof lat === "number" ? 1 : 0 });
    marker.addTo(map);
    markerRef.current = marker;
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onChange({ lat: p.lat, lng: p.lng, address: query || undefined });
      setStatus("Pin moved.");
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng).setOpacity(1);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng, address: query || undefined });
      setStatus("Pin placed.");
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function place(nlat: number, nlng: number, label?: string) {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      marker.setLatLng([nlat, nlng]).setOpacity(1);
      map.setView([nlat, nlng], 15);
    }
    onChange({ lat: nlat, lng: nlng, address: label ?? query ?? undefined });
  }

  async function resolve() {
    const q = query.trim();
    if (!q) return;

    const coords = parseCoords(q);
    if (coords) {
      place(coords.lat, coords.lng);
      setStatus("Location set from link.");
      return;
    }

    if (/goo\.gl|maps\.app\.goo\.gl/.test(q)) {
      setStatus("Short Google links can't be read here — open it and paste the full URL, or type the address.");
      return;
    }

    setBusy(true);
    setStatus("Searching…");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } }
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (data.length === 0) {
        setStatus("No match — try a fuller address, or paste a Google Maps link.");
        return;
      }
      const hit = data[0];
      place(parseFloat(hit.lat), parseFloat(hit.lon), q);
      setStatus(hit.display_name);
    } catch {
      setStatus("Search failed — paste a Google Maps link instead.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    markerRef.current?.setOpacity(0);
    setQuery("");
    setStatus(null);
    onChange({ lat: undefined, lng: undefined, address: undefined });
  }

  const hasPin = typeof lat === "number" && typeof lng === "number";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              resolve();
            }
          }}
          placeholder="Paste a Google Maps link, or type the store name / address"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={resolve}
          disabled={busy}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "Find"}
        </button>
      </div>

      <div className="h-56 w-full overflow-hidden rounded-xl border border-border">
        <div ref={elRef} className="h-full w-full" />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground/55">
          {hasPin ? `Pinned: ${lat!.toFixed(5)}, ${lng!.toFixed(5)}` : "No location set — drag/tap the map or search."}
        </span>
        {hasPin && (
          <button type="button" onClick={clear} className="font-semibold text-primary hover:underline">
            Clear
          </button>
        )}
      </div>
      {status && <p className="text-xs text-foreground/50">{status}</p>}
    </div>
  );
}
