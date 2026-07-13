"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { categories, reviewers, type Review, type Reviewer } from "@/lib/data";
import VideoCard from "./VideoCard";

const PAGE_SIZE = 6;

export default function ReviewsExplorer({
  reviews,
  compact = true,
}: {
  reviews: Review[];
  compact?: boolean;
}) {
  const [category, setCategory] = useState<string>("All");
  const [reviewer, setReviewer] = useState<"All" | Reviewer>("All");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (category !== "All" && !r.categories.includes(category)) return false;
      if (
        reviewer !== "All" &&
        !r.reviewer.includes(reviewer) &&
        !r.secondReviewer?.includes(reviewer)
      )
        return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.store.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.categories.some((c) => c.toLowerCase().includes(q)) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [category, reviewer, query, reviews]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, reviewer, query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((v) => v + PAGE_SIZE);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by dish, store, or location..."
          className="w-full rounded-full border-none bg-surface-muted py-2 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-foreground/40"
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-b border-border">
        <div className="flex gap-5 overflow-x-auto">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
                category === cat
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/50 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value as "All" | Reviewer)}
          className="ml-4 shrink-0 bg-transparent pb-2.5 text-sm font-semibold text-foreground/60 outline-none"
        >
          <option value="All">All Reviewers</option>
          {reviewers.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div
        className={
          compact
            ? "mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
            : "mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {visible.map((review) => (
          <VideoCard key={review.slug} review={review} compact={compact} />
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-foreground/60">
          No reviews match that search yet — check back soon.
        </p>
      )}
    </div>
  );
}
