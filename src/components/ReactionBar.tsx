"use client";

import { useEffect, useState } from "react";

type UserReaction = "like" | "dislike" | null;

export default function ReactionBar({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [likes, setLikes] = useState<number | null>(null);
  const [dislikes, setDislikes] = useState<number | null>(null);
  const [userReaction, setUserReaction] = useState<UserReaction>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setLikes(data.likes ?? 0);
        setDislikes(data.dislikes ?? 0);
      })
      .catch(() => {
        setLikes(0);
        setDislikes(0);
      });

    const stored = window.localStorage.getItem(`reaction:${slug}`) as UserReaction;
    setUserReaction(stored === "like" || stored === "dislike" ? stored : null);
  }, [slug]);

  async function sendDelta(type: "like" | "dislike", delta: 1 | -1) {
    const res = await fetch(`/api/reactions/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, delta }),
    });
    const data = await res.json();
    setLikes(data.likes ?? 0);
    setDislikes(data.dislikes ?? 0);
  }

  async function handleReaction(type: "like" | "dislike") {
    const opposite = type === "like" ? "dislike" : "like";

    if (userReaction === type) {
      await sendDelta(type, -1);
      setUserReaction(null);
      window.localStorage.removeItem(`reaction:${slug}`);
      return;
    }

    if (userReaction === opposite) {
      await sendDelta(opposite, -1);
    }

    await sendDelta(type, 1);
    setUserReaction(type);
    window.localStorage.setItem(`reaction:${slug}`, type);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled - ignore
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable - ignore
    }
  }

  const buttonBase =
    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => handleReaction("like")}
        className={`${buttonBase} ${
          userReaction === "like"
            ? "border-primary bg-primary text-white"
            : "border-border bg-surface text-foreground/70 hover:border-primary hover:text-primary"
        }`}
      >
        <svg viewBox="0 0 24 24" fill={userReaction === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M7 10v11M2 10h3.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H2v-11zM7 10l4.5-8a1.5 1.5 0 0 1 2.7 1.3L13 10h6.3a2 2 0 0 1 2 2.4l-1.6 8A2 2 0 0 1 17.7 22H7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {likes ?? "–"}
      </button>

      <button
        onClick={() => handleReaction("dislike")}
        className={`${buttonBase} ${
          userReaction === "dislike"
            ? "border-foreground/60 bg-foreground/10 text-foreground"
            : "border-border bg-surface text-foreground/70 hover:border-foreground/40"
        }`}
      >
        <svg viewBox="0 0 24 24" fill={userReaction === "dislike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="h-4 w-4 rotate-180">
          <path d="M7 10v11M2 10h3.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H2v-11zM7 10l4.5-8a1.5 1.5 0 0 1 2.7 1.3L13 10h6.3a2 2 0 0 1 2 2.4l-1.6 8A2 2 0 0 1 17.7 22H7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {dislikes ?? "–"}
      </button>

      <button
        onClick={handleShare}
        className={`${buttonBase} border-border bg-surface text-foreground/70 hover:border-accent hover:text-accent`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" strokeLinecap="round" />
        </svg>
        {copied ? "Link copied!" : "Share"}
      </button>
    </div>
  );
}
