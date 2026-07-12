"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { relativeTime } from "@/lib/time";
import type { Comment } from "@/lib/data";
import CommentForm from "./CommentForm";

const REPLIES_BATCH = 4;

function Avatar({ url, name, size = "md" }: { url: string | null; name: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-sm";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className={`${dims} shrink-0 rounded-full object-cover`} />
    );
  }
  return (
    <span
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-white`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

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
        className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {replies.length} {replies.length === 1 ? "reply" : "replies"}
      </button>
    );
  }

  const visible = replies.slice(0, visibleCount);
  const remaining = replies.length - visible.length;

  return (
    <div className="mt-2 flex flex-col gap-3">
      {visible.map((r) => (
        <div key={r.id} id={`comment-${r.id}`} className="flex gap-2.5 transition-colors duration-1000">
          <Avatar url={r.avatarUrl} name={r.authorName} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-foreground">{r.authorName}</span>
              <span className="text-[11px] text-foreground/40">{relativeTime(r.createdAt)}</span>
            </div>
            <p className="mt-0.5 break-words text-xs text-foreground/80">{r.message}</p>
          </div>
        </div>
      ))}
      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + REPLIES_BATCH)}
          className="self-start text-xs font-semibold text-primary hover:underline"
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
          className="self-start text-xs font-semibold text-foreground/50 hover:text-primary"
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
    <div className="flex flex-col">
      {comments.map((c) => (
        <div
          key={c.id}
          id={`comment-${c.id}`}
          className="flex gap-3 py-4 transition-colors duration-1000"
        >
          <Avatar url={c.avatarUrl} name={c.authorName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">{c.authorName}</span>
              <span className="text-xs text-foreground/40">{relativeTime(c.createdAt)}</span>
            </div>
            <p className="mt-0.5 break-words text-sm leading-snug text-foreground/80">
              {c.message}
            </p>

            {user ? (
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                className="mt-1.5 text-xs font-semibold text-foreground/50 hover:text-primary"
              >
                Reply
              </button>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(`/videos/${slug}`)}`}
                className="mt-1.5 inline-block text-xs font-semibold text-foreground/50 hover:text-primary hover:underline"
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
        </div>
      ))}
    </div>
  );
}
