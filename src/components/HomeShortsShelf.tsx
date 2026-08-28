"use client";

import Link from "next/link";
import { getPublicFileUrl } from "@/lib/media-url";
import { haptic } from "@/lib/haptics";
import type { Review } from "@/lib/data";

// A YouTube-style "Shorts" shelf: a horizontal, swipeable row of vertical clip
// thumbnails on the homepage. Tapping one drops you into the full-screen
// Shorts feed.
export default function HomeShortsShelf({ reviews }: { reviews: Review[] }) {
  const clips = reviews.filter((r) => r.videoKey).slice(0, 12);
  if (clips.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
          </svg>
        </span>
        <h2 className="font-display text-2xl tracking-wide text-foreground">Shorts</h2>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {clips.map((clip) => {
          const thumb = getPublicFileUrl(clip.thumbnailKey);
          return (
            <Link
              key={clip.slug}
              href={`/shorts?v=${clip.slug}`}
              onClick={() => haptic("light")}
              className="group relative w-36 shrink-0 overflow-hidden rounded-xl bg-surface-muted transition-transform active:scale-95"
            >
              <div className="relative aspect-[9/16] w-full">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={clip.title}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 line-clamp-2 text-xs font-semibold text-white drop-shadow">
                  {clip.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
