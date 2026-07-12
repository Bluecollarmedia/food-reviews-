"use client";

import Link from "next/link";
import { useComments } from "@/lib/use-comments";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

const PREVIEW_LIMIT = 3;

export default function CommentSection({ slug }: { slug: string }) {
  const { comments, refresh } = useComments(slug);
  const count = comments?.reduce((sum, c) => sum + 1 + c.replies.length, 0) ?? 0;
  const preview = comments ? comments.slice(0, PREVIEW_LIMIT) : null;

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-foreground">
        Comments{comments !== null ? ` (${count})` : ""}
      </h2>

      <div className="mt-4">
        <CommentForm slug={slug} onPosted={refresh} />
      </div>

      <CommentList comments={preview} slug={slug} onChanged={refresh} />

      {count > PREVIEW_LIMIT && (
        <Link
          href={`/videos/${slug}/comments`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          View all {count} comments
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
