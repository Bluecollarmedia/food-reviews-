import { NextRequest, NextResponse } from "next/server";

// Parse coordinates out of a Google Maps URL or plain "lat, lng" text.
function parseCoords(input: string): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|query|ll|destination|center|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /\/(-?\d+\.\d+),(-?\d+\.\d+)/,
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

// Live suggestions as you type, biased toward the D&S home turf (Lakewood NJ).
// Photon (OSM-based) handles business names far better than Nominatim.
async function suggest(query: string) {
  if (query.length < 3) return NextResponse.json({ results: [] });
  try {
    const url =
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
      `&limit=6&lang=en&lat=40.09&lon=-74.22`;
    const res = await fetch(url, {
      headers: { "User-Agent": "DSFoodReviews/1.0 (admin location picker)" },
    });
    const data = (await res.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties: Record<string, string>;
      }>;
    };
    const results = (data.features ?? []).map((f) => {
      const p = f.properties;
      const label = [p.name, p.street, p.city ?? p.county, p.state]
        .filter((x, i, a) => x && a.indexOf(x) === i)
        .join(", ");
      return {
        label: label || p.name || "Unknown place",
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query: string = (body?.query ?? "").toString().trim();
  if (!query) return NextResponse.json({ error: "Empty query." }, { status: 400 });

  if (body?.suggest) return suggest(query);

  // 1) Already coordinates, or a full Maps URL with coords in it.
  const direct = parseCoords(query);
  if (direct) return NextResponse.json({ ...direct });

  // 2) A URL — follow redirects (handles short goo.gl / maps.app.goo.gl links)
  //    and look for coords in the final URL, then the page HTML.
  if (/^https?:\/\//i.test(query)) {
    try {
      const res = await fetch(query, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DSFoodReviews/1.0)" },
      });
      const fromUrl = parseCoords(res.url);
      if (fromUrl) return NextResponse.json({ ...fromUrl });
      const html = await res.text();
      const fromHtml =
        parseCoords(html) ||
        (() => {
          const m = html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
          return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
        })();
      if (fromHtml && Math.abs(fromHtml.lat) <= 90 && Math.abs(fromHtml.lng) <= 180) {
        return NextResponse.json({ ...fromHtml });
      }
      return NextResponse.json(
        { error: "Couldn't read a location from that link. Try the address or the full maps URL." },
        { status: 422 }
      );
    } catch {
      return NextResponse.json({ error: "Couldn't open that link." }, { status: 422 });
    }
  }

  // 3) Plain text — geocode via Nominatim (server-side so the User-Agent is set).
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "DSFoodReviews/1.0 (admin location picker)" } }
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (data.length === 0) {
      return NextResponse.json(
        { error: "No match. Try a fuller address, or paste the Google Maps link." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: data[0].display_name,
    });
  } catch {
    return NextResponse.json({ error: "Search failed. Paste a Google Maps link instead." }, { status: 502 });
  }
}
