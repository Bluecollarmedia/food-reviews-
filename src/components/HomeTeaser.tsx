"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { categories, reviewers, type Review, type Reviewer } from "@/lib/data";
import VideoCard from "./VideoCard";
import HomeShortsShelf from "./HomeShortsShelf";

const INITIAL_COUNT = 7;
const BATCH_SIZE = 10;

export default function HomeTeaser({ reviews }: { reviews: Review[] }) {
  const [category, setCategory] = useState<string>("All");
  const [reviewer, setReviewer] = useState<"All" | Reviewer>("All");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
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
    setVisibleCount(INITIAL_COUNT);
  }, [category, reviewer, query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Only surface the Shorts shelf on the default (unfiltered) view, tucked in
  // after the first few reviews — not in the middle of a filtered result.
  const showShelf =
    category === "All" && reviewer === "All" && !query.trim() && visible.length > 3;

  // Auto-load the next batch as the sentinel nears the viewport — on every
  // screen size, so the feed just keeps scrolling instead of asking.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((v) => v + BATCH_SIZE);
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  return (
    <>
      <div className="relative mt-6">
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
        <select
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value as "All" | Reviewer)}
          className="shrink-0 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-semibold text-foreground/70 outline-none"
        >
          <option value="All">All Reviewers</option>
          {reviewers.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 flex flex-wrap gap-6">
        {visible.map((review, index) => (
          <Fragment key={review.slug}>
            <div className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)]">
              <VideoCard review={review} priority={index < 4} />
            </div>
            {showShelf && index === 2 && (
              <div className="w-full py-2">
                <HomeShortsShelf reviews={reviews} />
              </div>
            )}
          </Fragment>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-foreground/60">
          No reviews match that search yet — check back soon.
        </p>
      )}
    </>
  );
}
