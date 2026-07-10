"use client";

import { useState } from "react";
import type { Comment } from "@/lib/data";

export default function CommentForm({
  slug,
  onPosted,
}: {
  slug: string;
  onPosted: (comments: Comment[]) => void;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      onPosted(data.comments ?? []);
      setMessage("");
    } catch {
      setError("Couldn't post your comment. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim() && message.trim() && !submitting;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-surface-muted p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={60}
        className="mb-1.5 w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-foreground/40"
      />
      <div className="flex items-end gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a comment..."
          rows={1}
          maxLength={500}
          className="min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Post comment"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 -translate-x-px">
            <path d="M3 20v-6l8-2-8-2V4l19 8-19 8z" />
          </svg>
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-primary">{error}</p>}
    </form>
  );
}
