import Link from "next/link";
import ScoreBadge from "./ScoreBadge";
import { getPublicFileUrl } from "@/lib/media-url";
import type { Review } from "@/lib/data";

export default function VideoCard({
  review,
  progressPercent,
  compact = false,
}: {
  review: Review;
  progressPercent?: number;
  compact?: boolean;
}) {
  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);

  return (
    <Link
      href={`/videos/${review.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-surface shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-accent bg-cover bg-center"
        style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : undefined}
      >
        {!thumbnailUrl && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        )}
        {thumbnailUrl && <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/25" />}

        {!review.videoKey ? (
          <span
            className={`absolute bottom-2 right-2 rounded-full bg-black/55 font-semibold uppercase tracking-wide text-white ${
              compact ? "px-1.5 py-1 text-[9px]" : "px-3 py-1 text-xs"
            }`}
          >
            Coming Soon
          </span>
        ) : (
          <span
            className={`absolute flex items-center gap-1 rounded-full bg-black/60 font-semibold text-white ${
              compact ? "bottom-1.5 right-1.5 px-1.5 py-1 text-[9px]" : "bottom-2.5 right-2.5 px-2.5 py-1.5 text-xs"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}>
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </span>
        )}

        {typeof progressPercent === "number" && progressPercent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/40">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col gap-1.5 ${compact ? "p-2.5" : "p-3 sm:gap-2 sm:p-4"}`}>
        <div className="flex flex-wrap gap-1.5">
          {review.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-accent"
            >
              {c}
            </span>
          ))}
        </div>
        <h3
          className={`line-clamp-2 font-display leading-tight tracking-wide text-foreground ${
            compact ? "text-base" : "text-lg sm:text-xl"
          }`}
        >
          {review.title}
        </h3>
        <p className="truncate text-sm text-foreground/60">
          {review.store} &middot; {review.city}
          {review.price ? ` · ${review.price}` : ""}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <ScoreBadge rating={review.rating} size="sm" />
          <span className="truncate text-xs font-medium text-foreground/50">by {review.reviewer}</span>
        </div>
      </div>
    </Link>
  );
}
