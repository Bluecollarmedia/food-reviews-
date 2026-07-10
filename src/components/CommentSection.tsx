"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/data";

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/comments/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setComments(data.comments ?? []);
      setMessage("");
    } catch {
      setError("Couldn't post your comment. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  const count = comments?.length ?? 0;

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-foreground">
        Comments ({count})
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={60}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a comment..."
          rows={3}
          maxLength={500}
          className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="self-end rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      <ul className="mt-6 flex flex-col gap-4">
        {comments === null && (
          <li className="text-sm text-foreground/60">Loading comments...</li>
        )}
        {comments?.map((c) => (
          <li key={c.id} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-sm text-white">
              {c.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{c.name}</span>
                <span className="text-xs text-foreground/50">{c.timeAgo}</span>
              </div>
              <p className="mt-1 text-sm text-foreground/80">{c.message}</p>
            </div>
          </li>
        ))}
        {comments?.length === 0 && (
          <li className="text-sm text-foreground/60">Be the first to comment.</li>
        )}
      </ul>
    </div>
  );
}
