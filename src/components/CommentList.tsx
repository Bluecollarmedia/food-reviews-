"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { relativeTime } from "@/lib/time";
import type { Comment } from "@/lib/data";
import CommentForm from "./CommentForm";

export default function CommentList({
  comments,
  slug,
  onChanged,
}: {
  comments: Comment[] | null;
  slug: string;
  onChanged: () => void;
}) {
  const { user } = useSupabaseUser();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  if (comments === null) {
    return <p className="mt-4 text-sm text-foreground/60">Loading comments...</p>;
  }

  if (comments.length === 0) {
    return <p className="mt-4 text-sm text-foreground/60">Be the first to comment.</p>;
  }

  return (
    <ul className="mt-1">
      {comments.map((c, i) => (
        <li
          key={c.id}
          className={`flex gap-3 py-3 ${i < comments.length - 1 ? "border-b border-border" : ""}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs font-display text-white">
            {c.authorName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">{c.authorName}</span>
              <span className="text-xs text-foreground/40">{relativeTime(c.createdAt)}</span>
            </div>
            <p className="mt-0.5 break-words text-sm text-foreground/80">{c.message}</p>

            {user ? (
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                className="mt-1 text-xs font-semibold text-foreground/50 hover:text-primary"
              >
                Reply
              </button>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(`/videos/${slug}`)}`}
                className="mt-1 inline-block text-xs font-semibold text-foreground/50 hover:text-primary hover:underline"
              >
                Log in to reply
              </Link>
            )}

            {replyingTo === c.id && (
              <div className="mt-2">
                <CommentForm
                  slug={slug}
                  parentId={c.id}
                  placeholder={`Reply to ${c.authorName}...`}
                  onPosted={() => {
                    setReplyingTo(null);
                    onChanged();
                  }}
                />
              </div>
            )}

            {c.replies.length > 0 && (
              <ul className="mt-3 flex flex-col gap-3 border-l-2 border-border pl-3">
                {c.replies.map((r) => (
                  <li key={r.id} className="flex gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-light text-[10px] font-display text-white">
                      {r.authorName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-foreground">{r.authorName}</span>
                        <span className="text-[10px] text-foreground/40">{relativeTime(r.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 break-words text-xs text-foreground/80">{r.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
