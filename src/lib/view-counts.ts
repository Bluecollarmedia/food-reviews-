import { getStore } from "@netlify/blobs";

// The public-facing view count is deliberately padded so a brand-new upload
// looks established the moment it's posted. It's made of two parts:
//   1. A stable "starting" number derived from the slug (5,000–15,000, and
//      occasionally up to ~30,000), so every video begins with a believable
//      base and that base never jumps around between page loads.
//   2. The real view count on top, so the number still ticks up as actual
//      people watch.
// An admin can also pin an exact number (an override), which wins over both.
// The REAL count is always available separately in the admin panel.

function overrideStore() {
  return getStore("view-overrides");
}

/**
 * A stable, slug-derived starting view count. The same slug always yields the
 * same number, so the padded count is consistent on every render.
 */
export function baseViews(slug: string): number {
  // FNV-1a hash of the slug -> stable 32-bit number.
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const r = (h >>> 0) / 4294967295; // 0..1
  let base = 5000 + Math.floor(r * 10000); // 5,000–15,000

  // Roughly one in four videos gets a bigger number, up to ~30,000, for variety.
  const r2 = (Math.imul(h ^ 0x9e3779b9, 2654435761) >>> 0) / 4294967295;
  if (r2 < 0.25) {
    base += Math.floor((r2 / 0.25) * 15000); // adds up to ~15,000
  }
  return base;
}

export async function getViewOverride(slug: string): Promise<number | null> {
  const v = (await overrideStore().get(slug, { type: "json" })) as number | null;
  return typeof v === "number" ? v : null;
}

export async function getAllViewOverrides(
  slugs: string[]
): Promise<Record<string, number | null>> {
  const store = overrideStore();
  const entries = await Promise.all(
    slugs.map(
      async (s) =>
        [s, ((await store.get(s, { type: "json" })) as number | null) ?? null] as const
    )
  );
  return Object.fromEntries(entries);
}

export async function setViewOverride(slug: string, value: number): Promise<void> {
  await overrideStore().setJSON(slug, Math.max(0, Math.round(value)));
}

export async function clearViewOverride(slug: string): Promise<void> {
  await overrideStore().delete(slug);
}

/** The number the public should see for a video. */
export function publicViews(
  slug: string,
  realViews: number,
  override: number | null | undefined
): number {
  if (override !== null && override !== undefined) return override;
  return baseViews(slug) + realViews;
}

/** "12,432" — the full number, for detail pages and the admin panel. */
export function formatViewsFull(n: number): string {
  return n.toLocaleString("en-US");
}

/** "12K" / "12.4K" / "1.2M" — compact, YouTube-style, for cards. */
export function formatViewsShort(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return (k >= 100 || Number.isInteger(k) ? Math.round(k) : k.toFixed(1)) + "K";
  }
  const m = n / 1_000_000;
  return (m >= 100 || Number.isInteger(m) ? Math.round(m) : m.toFixed(1)) + "M";
}
