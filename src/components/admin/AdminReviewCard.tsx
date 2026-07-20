"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPublicFileUrl } from "@/lib/media-url";
import type { Review } from "@/lib/data";

export default function AdminReviewCard({
  review,
  views,
}: {
  review: Review;
  views: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);

  async function togglePublish() {
    setBusy(true);
    await fetch(`/api/admin/reviews/${review.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: review.title,
        store: review.store,
        city: review.city,
        categories: review.categories,
        rating: review.rating,
        price: review.price,
        description: review.description,
        reviewer: review.reviewer,
        videoKey: review.videoKey,
        thumbnailKey: review.thumbnailKey,
        status: review.status === "published" ? "draft" : "published",
      }),
    });
    setBusy(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${review.title}"? This can't be undone.`)) return;
    setBusy(true);
    await fetch(`/api/admin/reviews/${review.slug}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex gap-3 p-4">
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary to-accent">
          {thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg tracking-wide text-foreground">
            {review.title}
          </h3>
          <p className="truncate text-xs text-foreground/60">
            {review.store} &middot; {review.city} &middot; {review.rating}/10 &middot; {views} {views === 1 ? "view" : "views"}
          </p>
          <p className="mt-1 truncate text-xs text-foreground/50">
            {review.categories.join(", ")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                review.status === "published"
                  ? "bg-emerald-100 text-emerald-700"
                  : review.status === "locked"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-foreground/10 text-foreground/60"
              }`}
            >
              {review.status === "published"
                ? "Published"
                : review.status === "locked"
                ? "Locked"
                : "Draft"}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                review.videoKey
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-foreground/10 text-foreground/50"
              }`}
            >
              {review.videoKey ? "Video uploaded" : "No video"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border p-3">
        <Link
          href={`/admin/${review.slug}/edit`}
          className="rounded-full border border-border py-2 text-center text-xs font-semibold text-foreground/70 hover:border-primary hover:text-primary"
        >
          Edit
        </Link>
        <button
          onClick={togglePublish}
          disabled={busy}
          className="rounded-full border border-border py-2 text-xs font-semibold text-foreground/70 hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {review.status === "published" ? "Make Private" : "Publish"}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="rounded-full border border-primary py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
