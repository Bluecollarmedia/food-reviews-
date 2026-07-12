"use client";

import { useState } from "react";
import { useComments } from "@/lib/use-comments";
import { relativeTime } from "@/lib/time";
import type { Comment } from "@/lib/data";

export default function AdminCommentsPanel({ slug }: { slug: string }) {
  const { comments, refresh } = useComments(slug);
  const [busyId, setBusyId] = useState<string | null>(null);
  const count = comments?.reduce((sum, c) => sum + 1 + c.replies.length, 0) ?? 0;

  async function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setBusyId(commentId);
    await fetch(`/api/admin/comments/${slug}/${commentId}`, { method: "DELETE" });
    await refresh();
    setBusyId(null);
  }

  function renderComment(c: Comment, small = false) {
    return (
      <div
        className={`flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface ${small ? "p-3" : "p-4"}`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-foreground ${small ? "text-xs" : "text-sm"}`}>
              {c.authorName}
            </span>
            <span className="text-xs text-foreground/50">{relativeTime(c.createdAt)}</span>
            {c.isGuest && (
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-foreground/50">
                Guest
              </span>
            )}
          </div>
          <p className={`mt-1 text-foreground/80 ${small ? "text-xs" : "text-sm"}`}>{c.message}</p>
        </div>
        <button
          onClick={() => handleDelete(c.id)}
          disabled={busyId === c.id}
          className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-border pt-6">
      <h2 className="font-display text-2xl tracking-wide text-foreground">
        Comments {comments ? `(${count})` : ""}
      </h2>

      <ul className="mt-4 flex flex-col gap-3">
        {comments === null && (
          <li className="text-sm text-foreground/60">Loading comments...</li>
        )}
        {comments?.map((c) => (
          <li key={c.id} className="flex flex-col gap-2">
            {renderComment(c)}
            {c.replies.length > 0 && (
              <ul className="ml-6 flex flex-col gap-2 border-l-2 border-border pl-3">
                {c.replies.map((r) => (
                  <li key={r.id}>{renderComment(r, true)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
        {comments?.length === 0 && (
          <li className="text-sm text-foreground/60">No comments on this review yet.</li>
        )}
      </ul>
    </div>
  );
}
