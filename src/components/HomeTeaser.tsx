"use client";

import { useState } from "react";
import VideoCard from "./VideoCard";
import type { Review } from "@/lib/data";

const INITIAL_COUNT = 7;
const BATCH_SIZE = 10;

export default function HomeTeaser({ reviews }: { reviews: Review[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [pressed, setPressed] = useState(false);
  const visible = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  function handleClick() {
    setPressed(true);
    setVisibleCount((v) => v + BATCH_SIZE);
    setTimeout(() => setPressed(false), 300);
  }

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
            onClick={handleClick}
            className={`inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-dark active:scale-95 ${
              pressed ? "scale-95" : "scale-100"
            }`}
          >
            View More
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`h-4 w-4 animate-bounce ${pressed ? "animate-none" : ""}`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
