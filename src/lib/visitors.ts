import { getStore } from "@netlify/blobs";

// A lightweight visitor log grouped by IP: instead of a flat firehose of "the
// same IP a million times", each IP gets ONE record with its recent visit
// times. The admin can label who an IP is, and hide IPs (e.g. their own) so
// they don't clutter the list.

const MAX_HITS = 150; // keep the last N visits per IP; plenty for a small site

export type VisitorHit = { t: string; p: string };

export type VisitorRecord = {
  ip: string;
  label?: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  hits: VisitorHit[]; // most recent first, capped at MAX_HITS
};

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
  const now = new Date().toISOString();
  const hit: VisitorHit = { t: now, p: path || "/" };

  const existing = (await s.get(key, { type: "json" })) as VisitorRecord | null;
  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
    existing.hits = [hit, ...existing.hits].slice(0, MAX_HITS);
    await s.setJSON(key, existing);
  } else {
    const record: VisitorRecord = {
      ip,
      count: 1,
      firstSeen: now,
      lastSeen: now,
      hits: [hit],
    };
    await s.setJSON(key, record);
  }
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
