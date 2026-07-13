"use client";

import { useState } from "react";
import VideoCard from "./VideoCard";
import type { Review } from "@/lib/data";

const INITIAL_COUNT = 6;
const BATCH_SIZE = 6;

export default function HomeTeaser({ reviews }: { reviews: Review[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const visible = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {visible.map((review) => (
          <VideoCard key={review.slug} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((v) => v + BATCH_SIZE)}
            className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground/70 transition-colors hover:border-primary hover:text-primary"
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
}
