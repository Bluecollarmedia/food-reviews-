import { type Review } from "@/lib/data";

// A compact location row with a Directions button. Opens the viewer's maps app
// for turn-by-turn — a plain link, no API key or cost. Renders only when the
// review has a pinned location.
export default function LocationBar({ review }: { review: Review }) {
  if (typeof review.lat !== "number" || typeof review.lng !== "number") return null;

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${review.lat},${review.lng}`;
  const sub = review.mapAddress || review.city;

  return (
    <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-foreground">{review.store}</div>
        <div className="truncate text-xs text-foreground/55">{sub}</div>
      </div>

      <a
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
          <path d="M3 11l19-9-9 19-2-8-8-2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Directions
      </a>
    </div>
  );
}
