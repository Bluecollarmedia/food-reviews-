import { getStore } from "@netlify/blobs";

// A lightweight visitor log grouped by IP: instead of a flat firehose of "the
// same IP a million times", each IP gets ONE record with its recent visit
// times. The admin can label who an IP is, and hide IPs (e.g. their own) so
// they don't clutter the list.

const MAX_HITS = 150; // keep the last N visits per IP; plenty for a small site

// Reloading the same page within this window doesn't count as a new visit, so
// hammering refresh doesn't pad the number.
const DEDUPE_MS = 45_000;

export type VisitorHit = { t: string; p: string };

export type VisitorGeo = {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  org?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  flag?: string;
};

export type VisitorRecord = {
  ip: string;
  label?: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  hits: VisitorHit[]; // most recent first, capped at MAX_HITS
  geo?: VisitorGeo;
};

function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === "unknown" ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

// One-time geolocation lookup for an IP (city / region / country / ISP / coords)
// via the free, no-key ipwho.is HTTPS API. Best-effort — never throws.
async function lookupGeo(ip: string): Promise<VisitorGeo | null> {
  if (isPrivateIp(ip)) return null;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      success?: boolean;
      city?: string;
      region?: string;
      country?: string;
      country_code?: string;
      latitude?: number;
      longitude?: number;
      connection?: { isp?: string; org?: string };
      timezone?: { id?: string };
      flag?: { emoji?: string };
    };
    if (!d || d.success === false) return null;
    return {
      city: d.city,
      region: d.region,
      country: d.country,
      countryCode: d.country_code,
      isp: d.connection?.isp,
      org: d.connection?.org,
      lat: d.latitude,
      lon: d.longitude,
      timezone: d.timezone?.id,
      flag: d.flag?.emoji,
    };
  } catch {
    return null;
  }
}

type VisitorConfig = { hidden: string[] };

function store() {
  return getStore("visitors");
}

const CONFIG_KEY = "config";

// Blob keys must be simple; turn an IP into a safe key (and keep the "ip_"
// prefix so we can tell visitor records apart from the config blob).
function keyFor(ip: string): string {
  return "ip_" + ip.replace(/[^a-zA-Z0-9]/g, "_");
}

export async function recordVisit(ip: string, path: string): Promise<void> {
  if (!ip) return;
  const s = store();
  const key = keyFor(ip);
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const cleanPath = path || "/";
  const hit: VisitorHit = { t: now, p: cleanPath };

  const existing = (await s.get(key, { type: "json" })) as VisitorRecord | null;

  if (existing) {
    // Refresh de-dupe: same page reloaded within the window isn't a new visit.
    const last = existing.hits[0];
    const isRefresh =
      last && last.p === cleanPath && nowMs - new Date(last.t).getTime() < DEDUPE_MS;

    if (!isRefresh) {
      existing.count += 1;
      existing.hits = [hit, ...existing.hits].slice(0, MAX_HITS);
    }
    existing.lastSeen = now;
    // Fill in geolocation once, if we don't already have it.
    if (!existing.geo) {
      const geo = await lookupGeo(ip);
      if (geo) existing.geo = geo;
    }
    await s.setJSON(key, existing);
    return;
  }

  const geo = await lookupGeo(ip);
  const record: VisitorRecord = {
    ip,
    count: 1,
    firstSeen: now,
    lastSeen: now,
    hits: [hit],
    ...(geo ? { geo } : {}),
  };
  await s.setJSON(key, record);
}

export async function listVisitors(): Promise<VisitorRecord[]> {
  const s = store();
  const { blobs } = await s.list();
  const records = await Promise.all(
    blobs
      .filter((b) => b.key.startsWith("ip_"))
      .map((b) => s.get(b.key, { type: "json" }) as Promise<VisitorRecord>)
  );
  return records
    .filter(Boolean)
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

async function getConfig(): Promise<VisitorConfig> {
  const c = (await store().get(CONFIG_KEY, { type: "json" })) as VisitorConfig | null;
  return c && Array.isArray(c.hidden) ? c : { hidden: [] };
}

export async function getHiddenIps(): Promise<string[]> {
  return (await getConfig()).hidden;
}

export async function hideIp(ip: string): Promise<void> {
  const config = await getConfig();
  if (!config.hidden.includes(ip)) {
    config.hidden.push(ip);
    await store().setJSON(CONFIG_KEY, config);
  }
}

export async function unhideIp(ip: string): Promise<void> {
  const config = await getConfig();
  config.hidden = config.hidden.filter((x) => x !== ip);
  await store().setJSON(CONFIG_KEY, config);
}

export async function setLabel(ip: string, label: string): Promise<void> {
  const s = store();
  const key = keyFor(ip);
  const record = (await s.get(key, { type: "json" })) as VisitorRecord | null;
  if (record) {
    record.label = label.trim() || undefined;
    await s.setJSON(key, record);
  }
}

export async function clearVisitor(ip: string): Promise<void> {
  await store().delete(keyFor(ip));
  await unhideIp(ip);
}

export async function clearAllVisitors(): Promise<void> {
  const s = store();
  const { blobs } = await s.list();
  await Promise.all(
    blobs.filter((b) => b.key.startsWith("ip_")).map((b) => s.delete(b.key))
  );
}
