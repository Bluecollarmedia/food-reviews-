"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { relativeTime } from "@/lib/time";
import type { Comment } from "@/lib/data";
import CommentForm from "./CommentForm";

const REPLIES_BATCH = 4;

function hashMatchesAny(replies: Comment[]) {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  return hash !== "" && replies.some((r) => hash === `#comment-${r.id}`);
}

function RepliesSection({ replies }: { replies: Comment[] }) {
  const [expanded, setExpanded] = useState(() => hashMatchesAny(replies));
  const [visibleCount, setVisibleCount] = useState(REPLIES_BATCH);

  if (replies.length === 0) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-2 text-xs font-semibold text-primary hover:underline"
      >
        View {replies.length} {replies.length === 1 ? "reply" : "replies"}
      </button>
    );
  }

  const visible = replies.slice(0, visibleCount);
  const remaining = replies.length - visible.length;

  return (
    <div className="mt-3">
      <ul className="flex flex-col gap-3 border-l-2 border-border pl-3">
        {visible.map((r) => (
          <li
            key={r.id}
            id={`comment-${r.id}`}
            className="flex gap-2 transition-colors duration-1000"
          >
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
      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + REPLIES_BATCH)}
          className="mt-2 text-xs font-semibold text-primary hover:underline"
        >
          Load {Math.min(remaining, REPLIES_BATCH)} more {remaining === 1 ? "reply" : "replies"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setVisibleCount(REPLIES_BATCH);
          }}
          className="mt-2 text-xs font-semibold text-foreground/50 hover:text-primary"
        >
          Hide replies
        </button>
      )}
    </div>
  );
}

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
          id={`comment-${c.id}`}
          className={`flex gap-3 py-3 transition-colors duration-1000 ${i < comments.length - 1 ? "border-b border-border" : ""}`}
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

            <RepliesSection replies={c.replies} />
          </div>
        </li>
      ))}
    </ul>
  );
}
