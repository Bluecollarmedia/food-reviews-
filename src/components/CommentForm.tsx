"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/use-supabase-user";

export default function CommentForm({
  slug,
  parentId,
  placeholder = "Add a comment...",
  onPosted,
}: {
  slug: string;
  parentId?: string;
  placeholder?: string;
  onPosted: () => void;
}) {
  const { user, displayName } = useSupabaseUser();
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const needsGuestName = !user;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || (needsGuestName && !guestName.trim()) || submitting) return;
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.from("comments").insert({
      slug,
      message: message.trim().slice(0, 500),
      parent_id: parentId ?? null,
      user_id: user?.id ?? null,
      guest_name: user ? null : guestName.trim().slice(0, 60),
    });

    if (error) {
      setError("Couldn't post your comment. Try again in a moment.");
      setSubmitting(false);
      return;
    }

    setMessage("");
    setSubmitting(false);
    onPosted();
  }

  const canSubmit = message.trim() && (!needsGuestName || guestName.trim()) && !submitting;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-surface-muted p-3">
      {needsGuestName ? (
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Your name"
          maxLength={60}
          className="mb-1.5 w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-foreground/40"
        />
      ) : (
        displayName && (
          <p className="mb-1.5 text-sm font-semibold text-foreground">{displayName}</p>
        )
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
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
