"use client";

import { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import ScoreBadge from "./ScoreBadge";

export type SplitReviewer = {
  name: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  rating: number;
};

export default function SplitReviewHeader({
  slug,
  categories,
  title,
  store,
  city,
  price,
  reviewers,
}: {
  slug: string;
  categories: string[];
  title: string;
  store: string;
  city: string;
  price?: string;
  reviewers: SplitReviewer[];
}) {
  const [selected, setSelected] = useState(0);
  const current = reviewers[selected] ?? reviewers[0];

  return (
    <>
      <div className="mt-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {reviewers.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                selected === i
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-foreground/70 hover:border-primary hover:text-primary"
              }`}
            >
              {r.name}&apos;s Review
            </button>
          ))}
        </div>

        {current?.videoUrl ? (
          <VideoPlayer key={current.videoUrl} src={current.videoUrl} poster={current.thumbnailUrl} slug={slug} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-surface-muted text-sm text-foreground/60">
            {current?.name}&apos;s video coming soon
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-primary-dark"
              >
                {c}
              </span>
            ))}
          </div>
          <h1 className="mt-3 font-display text-4xl tracking-wide text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-foreground/60">
            {store} &middot; {city}
            {price ? ` · ${price}` : ""} &middot; Reviewed by {current?.name}
          </p>
        </div>
        <ScoreBadge rating={current?.rating ?? 0} size="lg" />
      </div>
    </>
  );
}
