"use client";

import { useState } from "react";
import VideoCard from "./VideoCard";
import type { Review } from "@/lib/data";

const INITIAL_COUNT = 4;

export default function RelatedVideosRow({ related }: { related: Review[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? related : related.slice(0, INITIAL_COUNT);
  const hasMore = !expanded && related.length > INITIAL_COUNT;

  return (
    <div className="-mx-5 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
      {visible.map((r) => (
        <div key={r.slug} className="w-64 shrink-0 snap-start sm:w-72">
          <VideoCard review={r} />
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(true)}
          className="flex aspect-video w-64 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface text-foreground/70 transition-colors hover:border-primary hover:text-primary sm:w-72"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-current">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-semibold">View More</span>
        </button>
      )}
    </div>
  );
}
