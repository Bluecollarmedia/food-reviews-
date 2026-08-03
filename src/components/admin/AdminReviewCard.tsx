"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPublicFileUrl } from "@/lib/media-url";
import { formatViewsFull } from "@/lib/view-counts";
import type { Review } from "@/lib/data";

export default function AdminReviewCard({
  review,
  views,
  publicViews,
  hasCustomViews = false,
  unlocked = true,
}: {
  review: Review;
  views: number;
  publicViews: number;
  hasCustomViews?: boolean;
  unlocked?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editingViews, setEditingViews] = useState(false);
  const [viewsInput, setViewsInput] = useState(String(publicViews));
  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);

  async function saveViews(value: number | null) {
    setBusy(true);
    const res = await fetch("/api/admin/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: review.slug, value }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Couldn't update the view count.");
      return;
    }
    setEditingViews(false);
    router.refresh();
  }

  // Locked/Vault videos are protected: their visibility can't be flipped and
  // they can't be deleted without the security passcode (server enforces this
  // too — this just hides the buttons so it's clear).
  const isProtected = review.status === "locked" || review.status === "vault";
  const canManage = !isProtected || unlocked;

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
    const res = await fetch(`/api/admin/reviews/${review.slug}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Couldn't delete.");
      return;
    }
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
            {review.store} &middot; {review.city} &middot; {review.rating}/10
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
                  : review.status === "vault"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-foreground/10 text-foreground/60"
              }`}
            >
              {review.status === "published"
                ? "Published"
                : review.status === "locked"
                ? "Locked"
                : review.status === "vault"
                ? "Vault"
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

      {/* View counts — real (actual visitors) vs. the padded number the public sees. */}
      <div className="border-t border-border px-4 py-3">
        {editingViews ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground/70">
              Public view count (what visitors see)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                value={viewsInput}
                onChange={(e) => setViewsInput(e.target.value)}
                className="w-36 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => saveViews(Number(viewsInput) || 0)}
                disabled={busy}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => saveViews(null)}
                disabled={busy}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground/70 hover:border-accent hover:text-accent disabled:opacity-50"
                title="Go back to the automatic count (starting number + real views)"
              >
                Auto
              </button>
              <button
                onClick={() => {
                  setViewsInput(String(publicViews));
                  setEditingViews(false);
                }}
                disabled={busy}
                className="text-xs font-semibold text-foreground/50 hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-foreground/70">
                <span className="font-semibold text-foreground">{formatViewsFull(views)}</span>{" "}
                real {views === 1 ? "view" : "views"}
              </span>
              <span className="text-foreground/70">
                <span className="font-semibold text-foreground">{formatViewsFull(publicViews)}</span>{" "}
                shown publicly
                {hasCustomViews && (
                  <span className="ml-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    custom
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => {
                setViewsInput(String(publicViews));
                setEditingViews(true);
              }}
              className="shrink-0 text-xs font-semibold text-primary hover:underline"
            >
              Edit views
            </button>
          </div>
        )}
      </div>

      {canManage ? (
        <div className="grid grid-cols-3 gap-2 border-t border-border p-3">
          <Link
            href={`/admin/${review.slug}/edit`}
            className="rounded-full border border-border py-2 text-center text-xs font-semibold text-foreground/70 hover:border-primary hover:text-primary"
          >
            Edit
          </Link>
          {isProtected ? (
            <Link
              href={`/admin/${review.slug}/edit`}
              className="rounded-full border border-border py-2 text-center text-xs font-semibold text-foreground/70 hover:border-accent hover:text-accent"
            >
              Change
            </Link>
          ) : (
            <button
              onClick={togglePublish}
              disabled={busy}
              className="rounded-full border border-border py-2 text-xs font-semibold text-foreground/70 hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {review.status === "published" ? "Make Private" : "Publish"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-full border border-primary py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <Link
            href={`/admin/${review.slug}/edit`}
            className="rounded-full border border-border px-4 py-2 text-center text-xs font-semibold text-foreground/70 hover:border-primary hover:text-primary"
          >
            Edit details
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Protected — unlock in Settings
          </span>
        </div>
      )}
    </div>
  );
}
