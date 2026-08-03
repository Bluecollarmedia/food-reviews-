import Link from "next/link";
import ScoreBadge from "./ScoreBadge";
import ThumbnailImage from "./ThumbnailImage";
import { getPublicFileUrl } from "@/lib/media-url";
import { formatViewsShort } from "@/lib/view-counts";
import type { Review } from "@/lib/data";

function Thumbnail({
  review,
  thumbnailUrl,
  progressPercent,
  priority,
}: {
  review: Review;
  thumbnailUrl: string | null;
  progressPercent?: number;
  priority?: boolean;
}) {
  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-accent">
      {thumbnailUrl ? (
        <ThumbnailImage src={thumbnailUrl} priority={priority} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
      )}
      {thumbnailUrl && <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/25" />}

      {!review.videoKey ? (
        <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Coming Soon
        </span>
      ) : (
        <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
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
  priority,
}: {
  review: Review;
  progressPercent?: number;
  priority?: boolean;
}) {
  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);

  return (
    <Link href={`/videos/${review.slug}`} className="group flex flex-col">
      <Thumbnail
        review={review}
        thumbnailUrl={thumbnailUrl}
        progressPercent={progressPercent}
        priority={priority}
      />
      <div className="flex gap-3 py-3">
        <div className="shrink-0">
          <ScoreBadge rating={review.rating} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground lg:text-base">
            {review.title}
          </h3>
          <p className="mt-1 truncate text-xs text-foreground/60">
            {review.reviewer}
            {review.secondReviewer ? ` & ${review.secondReviewer}` : ""} &middot; {review.city}
          </p>
          {typeof review.displayViews === "number" && (
            <p className="mt-0.5 truncate text-xs text-foreground/50">
              {formatViewsShort(review.displayViews)} views
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
