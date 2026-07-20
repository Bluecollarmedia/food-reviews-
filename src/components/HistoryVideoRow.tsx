import Link from "next/link";
import Image from "next/image";
import ScoreBadge from "./ScoreBadge";
import { getPublicFileUrl } from "@/lib/media-url";
import type { Review } from "@/lib/data";

export default function HistoryVideoRow({
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
      className="group flex gap-3 py-3 first:pt-0"
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary to-accent sm:w-40">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 128px, 160px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        )}
        {thumbnailUrl && (
          <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/25" />
        )}
        {typeof progressPercent === "number" && progressPercent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {review.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-foreground/60">
          {review.store} &middot; {review.city}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <ScoreBadge rating={review.rating} size="sm" />
          <span className="text-xs text-foreground/50">by {review.reviewer}</span>
        </div>
      </div>
    </Link>
  );
}
