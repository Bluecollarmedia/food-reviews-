import Link from "next/link";
import ScoreBadge from "./ScoreBadge";
import type { Review } from "@/lib/data";

export default function VideoCard({ review }: { review: Review }) {
  return (
    <Link
      href={`/videos/${review.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-accent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-md transition-transform group-hover:scale-110">
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Coming Soon
        </span>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {review.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-dark"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
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
