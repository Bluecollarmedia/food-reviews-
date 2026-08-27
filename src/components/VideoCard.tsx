import Link from "next/link";
import ThumbnailImage from "./ThumbnailImage";
import { getPublicFileUrl } from "@/lib/media-url";
import { formatViewsShort } from "@/lib/view-format";
import { formatDuration, reviewerNames, type Review } from "@/lib/data";

function scoreText(rating: number) {
  return Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);
}

function ScoreRing({ rating }: { rating: number }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 font-display text-sm leading-none text-white">
      {scoreText(rating)}
    </span>
  );
}

// A score with the reviewer's first name under it, so two scores read clearly
// as "David 8.7 / Chana 7.5" instead of two random numbers.
function ScoreWithName({ rating, name }: { rating: number; name: string }) {
  const first = name.trim().split(/\s+/)[0];
  return (
    <span className="flex flex-col items-center gap-0.5">
      <ScoreRing rating={rating} />
      <span className="max-w-[3.75rem] truncate text-[9px] font-bold uppercase leading-none tracking-wide text-white">
        {first}
      </span>
    </span>
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
  const duration = formatDuration(review.durationSeconds);

  const showBoth =
    review.showBothScores &&
    !!review.secondReviewer &&
    typeof review.secondReviewerRating === "number";

  return (
    <Link href={`/videos/${review.slug}`} className="group flex flex-col">
      {/* Cinematic thumbnail: rounded, soft-shadowed, with the score, category
          and duration floating right on the image. */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent shadow-[0_10px_24px_-12px_rgba(0,0,0,0.45)]">
        {thumbnailUrl ? (
          <ThumbnailImage src={thumbnailUrl} priority={priority} />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        )}
        {/* Legibility scrim so overlays never fight the image. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10 transition-colors group-hover:from-black/65" />

        {/* Score, top-left. Two scores show each reviewer's name underneath. */}
        {showBoth ? (
          <div className="absolute left-2.5 top-2.5 flex items-start gap-3 rounded-2xl bg-black/40 px-2.5 py-1.5 backdrop-blur-sm">
            <ScoreWithName rating={review.rating} name={review.reviewer} />
            <ScoreWithName rating={review.secondReviewerRating!} name={review.secondReviewer!} />
          </div>
        ) : (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
            <ScoreRing rating={review.rating} />
            <span className="pr-0.5 text-[11px] font-bold text-white">/10</span>
          </div>
        )}

        {/* Category, bottom-left. */}
        {review.categories[0] && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-foreground">
            {review.categories[0]}
          </span>
        )}

        {/* Duration (or Coming Soon), bottom-right. */}
        {!review.videoKey ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Coming Soon
          </span>
        ) : (
          duration && (
            <span className="absolute bottom-2.5 right-2.5 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">
              {duration}
            </span>
          )
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

      <div className="pt-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground lg:text-base">
          {review.title}
        </h3>
        <p className="mt-1.5 line-clamp-1 text-xs text-foreground/55">
          {reviewerNames(review)} &middot; {review.city}
          {typeof review.displayViews === "number" &&
            ` · ${formatViewsShort(review.displayViews)} views`}
        </p>
      </div>
    </Link>
  );
}
