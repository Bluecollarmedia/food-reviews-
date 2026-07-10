"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/data";

export default function AdminCommentsPanel({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/comments/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setComments(data.comments ?? []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setBusyId(commentId);
    const res = await fetch(`/api/admin/comments/${slug}/${commentId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);
    setComments(data?.comments ?? []);
    setBusyId(null);
  }

  return (
    <div className="mt-10 border-t border-border pt-6">
      <h2 className="font-display text-2xl tracking-wide text-foreground">
        Comments {comments ? `(${comments.length})` : ""}
      </h2>

      <ul className="mt-4 flex flex-col gap-3">
        {comments === null && (
          <li className="text-sm text-foreground/60">Loading comments...</li>
        )}
        {comments?.map((c) => (
          <li
            key={c.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{c.name}</span>
                <span className="text-xs text-foreground/50">{c.timeAgo}</span>
              </div>
              <p className="mt-1 text-sm text-foreground/80">{c.message}</p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={busyId === c.id}
              className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50"
            >
              Delete
            </button>
          </li>
        ))}
        {comments?.length === 0 && (
          <li className="text-sm text-foreground/60">No comments on this review yet.</li>
        )}
      </ul>
    </div>
  );
}
