import Link from "next/link";
import ScoreBadge from "./ScoreBadge";
import { getPublicFileUrl } from "@/lib/media-url";
import type { Review } from "@/lib/data";

export default function VideoCard({
  review,
  progressPercent,
}: {
  review: Review;
  progressPercent?: number;
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
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-md transition-transform group-hover:scale-110">
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        {!review.videoKey && (
          <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Coming Soon
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
      <div className="flex flex-1 flex-col gap-2 p-4">
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
        <h3 className="font-display text-xl leading-tight tracking-wide text-foreground">
          {review.title}
        </h3>
        <p className="text-sm text-foreground/60">
          {review.store} &middot; {review.city}
          {review.price ? ` · ${review.price}` : ""}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <ScoreBadge rating={review.rating} size="sm" />
          <span className="text-xs font-medium text-foreground/50">by {review.reviewer}</span>
        </div>
      </div>
    </Link>
  );
}
