"use client";

import { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import ScoreBadge from "./ScoreBadge";

export default function SplitReviewHeader({
  categories,
  title,
  store,
  city,
  price,
  davidVideoUrl,
  davidThumbnailUrl,
  davidRating,
  shmuelVideoUrl,
  shmuelThumbnailUrl,
  shmuelRating,
}: {
  categories: string[];
  title: string;
  store: string;
  city: string;
  price?: string;
  davidVideoUrl: string | null;
  davidThumbnailUrl: string | null;
  davidRating: number;
  shmuelVideoUrl: string | null;
  shmuelThumbnailUrl: string | null;
  shmuelRating?: number;
}) {
  const [selected, setSelected] = useState<"David" | "Shmuel">("David");

  const videoUrl = selected === "David" ? davidVideoUrl : shmuelVideoUrl;
  const thumbnailUrl = selected === "David" ? davidThumbnailUrl : shmuelThumbnailUrl;
  const rating = selected === "David" ? davidRating : shmuelRating ?? davidRating;

  return (
    <>
      <div className="mt-4">
        <div className="mb-3 flex gap-2">
          {(["David", "Shmuel"] as const).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setSelected(name)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                selected === name
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-foreground/70 hover:border-primary hover:text-primary"
              }`}
            >
              {name}&apos;s Review
            </button>
          ))}
        </div>

        {videoUrl ? (
          <VideoPlayer key={videoUrl} src={videoUrl} poster={thumbnailUrl} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-surface-muted text-sm text-foreground/60">
            {selected}&apos;s video coming soon
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
            {price ? ` · ${price}` : ""} &middot; Reviewed by {selected}
          </p>
        </div>
        <ScoreBadge rating={rating} size="lg" />
      </div>
    </>
  );
}
