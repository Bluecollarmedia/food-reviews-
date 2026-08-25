"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { createClient } from "@/lib/supabase/client";
import { relativeTime } from "@/lib/time";
import type { Comment } from "@/lib/data";
import CommentForm from "./CommentForm";

const REPLIES_BATCH = 4;

// Highlight @mentions in a comment so you can see who a reply is aimed at.
function renderMessage(text: string) {
  return text.split(/(\s+)/).map((part, i) =>
    part.length > 1 && part.startsWith("@") ? (
      <span key={i} className="font-semibold text-primary">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function Avatar({ url, name, size = "md" }: { url: string | null; name: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-sm";
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${dims} shrink-0 rounded-full object-cover`}
      />
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

function AttachedImage({ url, className }: { url: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Attached photo"
      loading="lazy"
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      className={`${className} pointer-events-none block select-none`}
      style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
    />
  );
}

function EditForm({
  initialText,
  onCancel,
  onSave,
}: {
  initialText: string;
  onCancel: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    await onSave(text.trim());
    setSaving(false);
  }

  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={500}
        autoFocus
        className="w-full resize-none rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-semibold text-foreground/50 hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function OwnerActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onEdit}
        className="mt-1.5 text-xs font-semibold text-foreground/50 hover:text-primary"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="mt-1.5 text-xs font-semibold text-foreground/50 hover:text-primary"
      >
        Delete
      </button>
    </>
  );
}

function hashMatchesAny(replies: Comment[]) {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  return hash !== "" && replies.some((r) => hash === `#comment-${r.id}`);
}

function RepliesSection({
  replies,
  slug,
  rootId,
  currentUserId,
  onChanged,
}: {
  replies: Comment[];
  slug: string;
  rootId: string;
  currentUserId: string | null;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(() => hashMatchesAny(replies));
  const [visibleCount, setVisibleCount] = useState(REPLIES_BATCH);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  if (replies.length === 0) return null;

  async function handleDelete(id: string) {
    if (!confirm("Delete this reply?")) return;
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    onChanged();
  }

  async function handleSaveEdit(id: string, text: string) {
    const supabase = createClient();
    await supabase.from("comments").update({ message: text }).eq("id", id);
    setEditingId(null);
    onChanged();
  }

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
    <div className="mt-2 flex flex-col gap-3 border-l-2 border-border pl-3.5">
      {visible.map((r) => (
        <div key={r.id} id={`comment-${r.id}`} className="flex gap-2.5 transition-colors duration-1000">
          <Avatar url={r.avatarUrl} name={r.authorName} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-foreground">{r.authorName}</span>
              <span className="text-[11px] text-foreground/40">{relativeTime(r.createdAt)}</span>
            </div>

            {editingId === r.id ? (
              <EditForm
                initialText={r.message}
                onCancel={() => setEditingId(null)}
                onSave={(text) => handleSaveEdit(r.id, text)}
              />
            ) : (
              <>
                {r.quoted && (
                  <div className="mt-1 flex items-center gap-1.5 overflow-hidden rounded-md border-l-[3px] border-accent bg-surface-muted px-2 py-1 text-[11px] text-foreground/50">
                    <span className="shrink-0">↳</span>
                    <span className="shrink-0 font-semibold text-foreground/60">{r.quoted.author}:</span>
                    <span className="truncate">{r.quoted.text}</span>
                  </div>
                )}
                {r.message && <p className="mt-0.5 break-words text-xs text-foreground/80">{renderMessage(r.message)}</p>}
                {r.imageUrl && <AttachedImage url={r.imageUrl} className="mt-1.5 max-h-48 rounded-lg object-cover" />}
                <div className="flex gap-3">
                  {currentUserId ? (
                    <button
                      type="button"
                      onClick={() => setReplyingToId(replyingToId === r.id ? null : r.id)}
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
                  {currentUserId && r.userId === currentUserId && (
                    <OwnerActions onEdit={() => setEditingId(r.id)} onDelete={() => handleDelete(r.id)} />
                  )}
                </div>
              </>
            )}

            {replyingToId === r.id && (
              <div className="mt-2">
                <CommentForm
                  slug={slug}
                  parentId={rootId}
                  replyToId={r.id}
                  initialValue={`@${r.authorName} `}
                  placeholder={`Reply to ${r.authorName}...`}
                  onPosted={() => {
                    setReplyingToId(null);
                    onChanged();
                  }}
                />
              </div>
            )}
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
  const [editingId, setEditingId] = useState<string | null>(null);

  if (comments === null) {
    return <p className="mt-4 text-sm text-foreground/60">Loading comments...</p>;
  }

  if (comments.length === 0) {
    return <p className="mt-4 text-sm text-foreground/60">Be the first to comment.</p>;
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this comment? Any replies under it will be deleted too.")) return;
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    onChanged();
  }

  async function handleSaveEdit(id: string, text: string) {
    const supabase = createClient();
    await supabase.from("comments").update({ message: text }).eq("id", id);
    setEditingId(null);
    onChanged();
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

            {editingId === c.id ? (
              <EditForm
                initialText={c.message}
                onCancel={() => setEditingId(null)}
                onSave={(text) => handleSaveEdit(c.id, text)}
              />
            ) : (
              <>
                {c.message && (
                  <p className="mt-0.5 break-words text-sm leading-snug text-foreground/80">
                    {renderMessage(c.message)}
                  </p>
                )}
                {c.imageUrl && <AttachedImage url={c.imageUrl} className="mt-1.5 max-h-64 rounded-lg object-cover" />}

                <div className="flex gap-3">
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
                  {user && c.userId === user.id && (
                    <OwnerActions onEdit={() => setEditingId(c.id)} onDelete={() => handleDelete(c.id)} />
                  )}
                </div>
              </>
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

            <RepliesSection
              replies={c.replies}
              slug={slug}
              rootId={c.id}
              currentUserId={user?.id ?? null}
              onChanged={onChanged}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
