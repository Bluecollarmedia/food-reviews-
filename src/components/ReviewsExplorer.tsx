"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { categories, reviewers, type Review, type Reviewer } from "@/lib/data";
import VideoCard from "./VideoCard";

const PAGE_SIZE = 6;

export default function ReviewsExplorer({ reviews }: { reviews: Review[] }) {
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

      <div className="mt-4 flex items-center gap-2">
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors active:scale-95 ${
                category === cat
                  ? "bg-foreground text-background"
                  : "bg-surface-muted text-foreground/70 hover:bg-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <div
            className={`pointer-events-none flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors ${
              reviewer !== "All"
                ? "bg-foreground text-background"
                : "bg-surface-muted text-foreground/60"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
            </svg>
            {reviewer !== "All" && <span className="max-w-[6rem] truncate">{reviewer}</span>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 opacity-70">
              <path d="M8 9l4-4 4 4M8 15l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <select
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value as "All" | Reviewer)}
            aria-label="Filter by reviewer"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            <option value="All">All Reviewers</option>
            {reviewers.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-6">
        {visible.map((review, index) => (
          <div
            key={review.slug}
            className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)]"
          >
            <VideoCard review={review} priority={index < 4} />
          </div>
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
