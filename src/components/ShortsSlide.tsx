"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getPublicFileUrl } from "@/lib/media-url";
import { reviewerNames, type Review } from "@/lib/data";
import AllCommentsClient from "./AllCommentsClient";
import { haptic } from "@/lib/haptics";

type UserReaction = "like" | "dislike" | null;

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex select-none flex-col items-center gap-1 transition-transform active:scale-90 ${
        active ? "text-primary" : "text-white"
      }`}
      style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
    >
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

export default function ShortsSlide({ review }: { review: Review }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [likes, setLikes] = useState<number | null>(null);
  const [dislikes, setDislikes] = useState<number | null>(null);
  const [userReaction, setUserReaction] = useState<UserReaction>(null);
  const [showComments, setShowComments] = useState(false);

  const videoUrl = getPublicFileUrl(review.videoKey);
  const thumbnailUrl = getPublicFileUrl(review.thumbnailKey);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.6),
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.currentTime = 0;
      v.play().catch(() => {
        // Autoplay with sound can be blocked without a prior user gesture —
        // fall back to muted autoplay so playback still starts either way.
        v.muted = true;
        setMuted(true);
        v.play().catch(() => {});
      });
    } else {
      v.pause();
    }
  }, [inView]);

  useEffect(() => {
    if (!inView) return;
    fetch(`/api/reactions/${review.slug}`)
      .then((res) => res.json())
      .then((data) => {
        setLikes(data.likes ?? 0);
        setDislikes(data.dislikes ?? 0);
      })
      .catch(() => {
        setLikes(0);
        setDislikes(0);
      });
    const stored = window.localStorage.getItem(`reaction:${review.slug}`) as UserReaction;
    setUserReaction(stored === "like" || stored === "dislike" ? stored : null);
  }, [inView, review.slug]);

  async function sendDelta(type: "like" | "dislike", delta: 1 | -1) {
    const res = await fetch(`/api/reactions/${review.slug}`, {
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
    haptic(userReaction === type ? "light" : "medium");
    if (userReaction === type) {
      await sendDelta(type, -1);
      setUserReaction(null);
      window.localStorage.removeItem(`reaction:${review.slug}`);
      return;
    }
    if (userReaction === opposite) await sendDelta(opposite, -1);
    await sendDelta(type, 1);
    setUserReaction(type);
    window.localStorage.setItem(`reaction:${review.slug}`, type);
  }

  async function handleShare() {
    haptic("light");
    const url = `${window.location.origin}/videos/${review.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: review.title, url });
      } catch {
        // user cancelled
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full select-none snap-start snap-always overflow-hidden bg-black"
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", touchAction: "manipulation" }}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl ?? undefined}
          muted={muted}
          loop
          playsInline
          preload={inView ? "auto" : "none"}
          className="absolute inset-0 h-full w-full select-none object-cover"
          style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={() => {
            if (videoRef.current) videoRef.current.playbackRate = 2;
            setHeld(true);
          }}
          onPointerUp={() => {
            if (videoRef.current) videoRef.current.playbackRate = 1;
            setHeld(false);
          }}
          onPointerLeave={() => {
            if (videoRef.current) videoRef.current.playbackRate = 1;
            setHeld(false);
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
      )}

      {held && (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 select-none rounded-full bg-black/70 px-4 py-1.5 text-sm font-bold text-white">
          2x speed
        </div>
      )}

      <div
        className="absolute right-3 z-10 flex flex-col items-center gap-6"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <ActionButton
          active={userReaction === "like"}
          label={likes === null ? "–" : String(likes)}
          onClick={() => handleReaction("like")}
          icon={
            <svg viewBox="0 0 24 24" fill={userReaction === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="h-8 w-8">
              <path d="M7 10v11M2 10h3.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H2v-11zM7 10l4.5-8a1.5 1.5 0 0 1 2.7 1.3L13 10h6.3a2 2 0 0 1 2 2.4l-1.6 8A2 2 0 0 1 17.7 22H7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <ActionButton
          active={userReaction === "dislike"}
          label={dislikes === null ? "–" : String(dislikes)}
          onClick={() => handleReaction("dislike")}
          icon={
            <svg viewBox="0 0 24 24" fill={userReaction === "dislike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="h-8 w-8 rotate-180">
              <path d="M7 10v11M2 10h3.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H2v-11zM7 10l4.5-8a1.5 1.5 0 0 1 2.7 1.3L13 10h6.3a2 2 0 0 1 2 2.4l-1.6 8A2 2 0 0 1 17.7 22H7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <ActionButton
          label="Comments"
          onClick={() => setShowComments(true)}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <ActionButton
          label="Share"
          onClick={handleShare}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none bg-gradient-to-t from-black/80 to-transparent px-4 pt-14 pr-20 text-white"
        style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <Link
          href={`/videos/${review.slug}`}
          className="pointer-events-auto inline-block font-semibold hover:underline"
        >
          {review.title}
        </Link>
        <p className="mt-1 text-sm text-white/80">
          {reviewerNames(review)} &middot; {review.city}
        </p>
      </div>

      {showComments && (
        <>
          <button
            aria-label="Close comments"
            onClick={() => setShowComments(false)}
            className="absolute inset-x-0 top-0 z-20 h-1/2"
          />
          <div className="absolute inset-x-0 bottom-0 z-30 flex h-1/2 flex-col rounded-t-2xl bg-background shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <p className="font-display text-lg tracking-wide text-foreground">Comments</p>
              <button
                onClick={() => setShowComments(false)}
                aria-label="Close comments"
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/50 hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-3"
              style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <AllCommentsClient slug={review.slug} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
