"use client";

import { useState } from "react";
import { categories, reviews } from "@/lib/data";
import VideoCard from "./VideoCard";

export default function CategoryFilterGrid() {
  const [active, setActive] = useState<string>("All");

  const filtered =
    active === "All" ? reviews : reviews.filter((r) => r.category === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              active === cat
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-foreground/70 hover:border-primary hover:text-primary"
            }`}
          >
            {cat}
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
          No reviews in this category yet — check back soon.
        </p>
      )}
    </div>
  );
}
