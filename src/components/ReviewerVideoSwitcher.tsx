"use client";

import { useState } from "react";
import VideoPlayer from "./VideoPlayer";

export default function ReviewerVideoSwitcher({
  davidVideoUrl,
  davidThumbnailUrl,
  shmuelVideoUrl,
  shmuelThumbnailUrl,
}: {
  davidVideoUrl: string | null;
  davidThumbnailUrl: string | null;
  shmuelVideoUrl: string | null;
  shmuelThumbnailUrl: string | null;
}) {
  const [selected, setSelected] = useState<"David" | "Shmuel">("David");

  const videoUrl = selected === "David" ? davidVideoUrl : shmuelVideoUrl;
  const thumbnailUrl = selected === "David" ? davidThumbnailUrl : shmuelThumbnailUrl;

  return (
    <div className="mt-4">
      <div className="mb-3 flex gap-2">
        {(["David", "Shmuel"] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSelected(name)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              selected === name
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-foreground/70 hover:border-primary hover:text-primary"
            }`}
          >
            {name}&apos;s Review
          </button>
        ))}
      </div>

      {videoUrl ? (
        <VideoPlayer key={videoUrl} src={videoUrl} poster={thumbnailUrl} />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-surface-muted text-sm text-foreground/60">
          {selected}&apos;s video coming soon
        </div>
      )}
    </div>
  );
}
