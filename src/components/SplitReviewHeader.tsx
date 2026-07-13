"use client";

import { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import ScoreBadge from "./ScoreBadge";

export default function SplitReviewHeader({
  slug,
  categories,
  title,
  store,
  city,
  price,
  firstReviewerName,
  firstVideoUrl,
  firstThumbnailUrl,
  firstRating,
  secondReviewerName,
  secondVideoUrl,
  secondThumbnailUrl,
  secondRating,
}: {
  slug: string;
  categories: string[];
  title: string;
  store: string;
  city: string;
  price?: string;
  firstReviewerName: string;
  firstVideoUrl: string | null;
  firstThumbnailUrl: string | null;
  firstRating: number;
  secondReviewerName: string;
  secondVideoUrl: string | null;
  secondThumbnailUrl: string | null;
  secondRating?: number;
}) {
  const [selected, setSelected] = useState<"first" | "second">("first");

  const videoUrl = selected === "first" ? firstVideoUrl : secondVideoUrl;
  const thumbnailUrl = selected === "first" ? firstThumbnailUrl : secondThumbnailUrl;
  const rating = selected === "first" ? firstRating : secondRating ?? firstRating;
  const selectedName = selected === "first" ? firstReviewerName : secondReviewerName;

  return (
    <>
      <div className="mt-4">
        <div className="mb-3 flex gap-2">
          {(
            [
              { key: "first", name: firstReviewerName },
              { key: "second", name: secondReviewerName },
            ] as const
          ).map(({ key, name }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                selected === key
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-foreground/70 hover:border-primary hover:text-primary"
              }`}
            >
              {name}&apos;s Review
            </button>
          ))}
        </div>

        {videoUrl ? (
          <VideoPlayer key={videoUrl} src={videoUrl} poster={thumbnailUrl} slug={slug} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl bg-surface-muted text-sm text-foreground/60">
            {selectedName}&apos;s video coming soon
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
            {price ? ` · ${price}` : ""} &middot; Reviewed by {selectedName}
          </p>
        </div>
        <ScoreBadge rating={rating} size="lg" />
      </div>
    </>
  );
}
