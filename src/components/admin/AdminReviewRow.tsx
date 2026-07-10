"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Review } from "@/lib/data";

export default function AdminReviewRow({ review }: { review: Review }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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
    <tr className="border-b border-border">
      <td className="py-3 pr-4">
        <div className="font-semibold text-foreground">{review.title}</div>
        <div className="text-xs text-foreground/60">
          {review.store} &middot; {review.city}
        </div>
      </td>
      <td className="py-3 pr-4 text-sm text-foreground/70">{review.categories.join(", ")}</td>
      <td className="py-3 pr-4 text-sm text-foreground/70">{review.rating}/10</td>
      <td className="py-3 pr-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            review.status === "published"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-foreground/10 text-foreground/60"
          }`}
        >
          {review.status === "published" ? "Published" : "Draft"}
        </span>
      </td>
      <td className="py-3 pr-4">
        {review.videoKey ? (
          <span className="text-xs font-semibold text-emerald-700">Uploaded</span>
        ) : (
          <span className="text-xs text-foreground/50">No video</span>
        )}
      </td>
      <td className="py-3 flex flex-wrap gap-2">
        <Link
          href={`/admin/${review.slug}/edit`}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-primary hover:text-primary"
        >
          Edit
        </Link>
        <button
          onClick={togglePublish}
          disabled={busy}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/70 hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {review.status === "published" ? "Make Private" : "Publish"}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
