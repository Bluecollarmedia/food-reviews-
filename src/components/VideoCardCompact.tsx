import Link from "next/link";
import ScoreBadge from "./ScoreBadge";
import { getPublicFileUrl } from "@/lib/media-url";
import type { Review } from "@/lib/data";

export default function VideoCardCompact({ review }: { review: Review }) {
  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);

  return (
    <Link href={`/videos/${review.slug}`} className="group flex flex-col gap-1.5">
      <div
        className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-primary to-accent bg-cover bg-center"
        style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : undefined}
      >
        {!thumbnailUrl && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        )}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-md">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-3.5 w-3.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
        {!review.videoKey && (
          <span className="absolute bottom-1 right-1 rounded bg-foreground/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            Soon
          </span>
        )}
      </div>
      <div className="flex items-start gap-1.5">
        <ScoreBadge rating={review.rating} size="xs" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-sm">
            {review.title}
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-foreground/50">{review.city}</p>
        </div>
      </div>
    </Link>
  );
}
