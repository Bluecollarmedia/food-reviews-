"use client";

import { useMemo, useState } from "react";
import { categories, reviewers, reviews, type Reviewer } from "@/lib/data";
import VideoCard from "./VideoCard";

export default function ReviewsExplorer() {
  const [category, setCategory] = useState<string>("All");
  const [reviewer, setReviewer] = useState<"All" | Reviewer>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (category !== "All" && r.category !== category) return false;
      if (reviewer !== "All" && !r.reviewer.includes(reviewer)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.store.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [category, reviewer, query]);

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
          className="w-full rounded-full border border-border bg-surface py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              category === cat
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-foreground/70 hover:border-primary hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["All", ...reviewers] as const).map((r) => (
          <button
            key={r}
            onClick={() => setReviewer(r)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              reviewer === r
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-foreground/70 hover:border-accent hover:text-accent"
            }`}
          >
            {r === "All" ? "All Reviewers" : r}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((review) => (
          <VideoCard key={review.slug} review={review} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-foreground/60">
          No reviews match that search yet — check back soon.
        </p>
      )}
    </div>
  );
}
