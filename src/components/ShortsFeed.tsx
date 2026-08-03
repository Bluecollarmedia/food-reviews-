"use client";

import type { Review } from "@/lib/data";
import ShortsSlide from "./ShortsSlide";

export default function ShortsFeed({ reviews }: { reviews: Review[] }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 top-[var(--header-h,73px)] snap-y snap-mandatory overflow-y-scroll bg-black"
      style={{ overscrollBehaviorY: "contain" }}
    >
      {reviews.map((review) => (
        <div key={review.slug} className="h-full w-full snap-start" style={{ scrollSnapStop: "always" }}>
          <ShortsSlide review={review} />
        </div>
      ))}
    </div>
  );
}
