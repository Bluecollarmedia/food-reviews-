import Link from "next/link";
import ScoreBadge from "./ScoreBadge";
import { getPublicFileUrl } from "@/lib/media-url";
import type { Review } from "@/lib/data";

function Thumbnail({
  review,
  thumbnailUrl,
  progressPercent,
  compact,
}: {
  review: Review;
  thumbnailUrl: string | null;
  progressPercent?: number;
  compact: boolean;
}) {
  return (
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
  );
}

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
    <Link href={`/videos/${review.slug}`} className="group flex flex-col">
      <Thumbnail review={review} thumbnailUrl={thumbnailUrl} progressPercent={progressPercent} compact={compact} />
      <div className={`flex ${compact ? "gap-2 py-2" : "gap-3 py-3"}`}>
        <div className="shrink-0">
          <ScoreBadge rating={review.rating} size={compact ? "xs" : "sm"} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`line-clamp-2 font-semibold leading-snug text-foreground ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {review.title}
          </h3>
          <p className={`mt-1 truncate text-foreground/60 ${compact ? "text-[10px]" : "text-xs"}`}>
            {review.reviewer}
            {review.secondReviewer ? ` & ${review.secondReviewer}` : ""} &middot; {review.city}
          </p>
        </div>
      </div>
    </Link>
  );
}
