import type { Comment } from "@/lib/data";

export default function CommentList({ comments }: { comments: Comment[] | null }) {
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
            {c.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground">{c.name}</span>
              <span className="text-xs text-foreground/40">{c.timeAgo}</span>
            </div>
            <p className="mt-0.5 break-words text-sm text-foreground/80">{c.message}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
