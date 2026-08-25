"use client";

import { useState } from "react";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { resizeImageMaxDimension } from "@/lib/resize-image";
import { uploadCommentImage } from "@/lib/upload-comment-image";

export default function CommentForm({
  slug,
  parentId,
  replyToId,
  placeholder = "Add a comment...",
  initialValue = "",
  onPosted,
}: {
  slug: string;
  parentId?: string;
  replyToId?: string;
  placeholder?: string;
  initialValue?: string;
  onPosted: () => void;
}) {
  const { user, displayName, avatarUrl } = useSupabaseUser();
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState(initialValue);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const needsGuestName = !user;

  function handleImagePicked(file: File | undefined) {
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreviewUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!message.trim() && !imageFile) || (needsGuestName && !guestName.trim()) || submitting)
      return;
    setSubmitting(true);
    setError("");

    let imageKey: string | null = null;
    if (imageFile) {
      try {
        const resized = await resizeImageMaxDimension(imageFile);
        imageKey = await uploadCommentImage(resized);
      } catch {
        setError("Couldn't upload that photo. Try again in a moment.");
        setSubmitting(false);
        return;
      }
    }

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        message: message.trim(),
        parentId: parentId ?? null,
        replyToId: replyToId ?? null,
        guestName: user ? undefined : guestName.trim(),
        imageKey,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't post your comment. Try again in a moment.");
      setSubmitting(false);
      return;
    }

    setMessage("");
    removeImage();
    setSubmitting(false);
    onPosted();
  }

  const canSubmit =
    (message.trim() || imageFile) && (!needsGuestName || guestName.trim()) && !submitting;

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
          <div className="mb-1.5 flex items-center gap-2">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="h-5 w-5 rounded-full object-cover" />
            )}
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
          </div>
        )
      )}
      {imagePreviewUrl && (
        <div className="relative mb-1.5 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreviewUrl} alt="Attached photo preview" className="h-16 w-16 rounded-lg object-cover" />
          <button
            type="button"
            onClick={removeImage}
            aria-label="Remove photo"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
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
        <label
          aria-label="Attach photo"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-surface hover:text-primary"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImagePicked(e.target.files?.[0])}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px]">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
            <path d="M21 15l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
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
