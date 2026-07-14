"use client";

import { useEffect, useRef, useState } from "react";
import VideoCard from "./VideoCard";
import type { Review } from "@/lib/data";

const INITIAL_COUNT = 7;
const BATCH_SIZE = 10;

export default function HomeTeaser({ reviews }: { reviews: Review[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visible = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((v) => v + BATCH_SIZE);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-6">
        {visible.map((review) => (
          <div
            key={review.slug}
            className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)]"
          >
            <VideoCard review={review} />
          </div>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </>
  );
}
