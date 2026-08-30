"use client";

import type { Review } from "@/lib/data";
import ShortsSlide from "./ShortsSlide";

export default function ShortsFeed({ reviews }: { reviews: Review[] }) {
  return (
    // Full-screen, one-short-per-swipe. `no-scrollbar` hides the native
    // scrollbar so you can't drag-fling through the whole feed at once, and
    // 100dvh keeps it exactly the visible height even as the browser bars
    // show/hide.
    <div
      className="shorts-feed no-scrollbar fixed inset-0 z-30 snap-y snap-mandatory overflow-y-scroll bg-black"
      style={{ height: "100dvh", overscrollBehaviorY: "contain" }}
    >
      {reviews.map((review) => (
        <div
          key={review.slug}
          className="w-full snap-start"
          style={{ height: "100dvh", scrollSnapStop: "always" }}
        >
          <ShortsSlide review={review} />
        </div>
      ))}
    </div>
  );
}
