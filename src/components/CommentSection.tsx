"use client";

import { useState } from "react";
import type { Comment } from "@/lib/data";

export default function CommentSection({
  initialComments,
}: {
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setComments((prev) => [
      { id: crypto.randomUUID(), name: name.trim(), message: message.trim(), timeAgo: "now" },
      ...prev,
    ]);
    setMessage("");
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-foreground">
        Comments ({comments.length})
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a comment..."
          rows={3}
          className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="self-end rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Post Comment
        </button>
      </form>

      <ul className="mt-6 flex flex-col gap-4">
        {comments.map((c) => (
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
        {comments.length === 0 && (
          <li className="text-sm text-foreground/60">Be the first to comment.</li>
        )}
      </ul>
    </div>
  );
}
