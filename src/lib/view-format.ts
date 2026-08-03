// Pure view-count helpers and the shared setting type. No server-only imports
// here, so client components can use these without pulling in @netlify/blobs.

export type ViewSetting =
  | { mode: "fixed"; value: number }
  | { mode: "auto"; start: string; startViews: number; target: number };

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
