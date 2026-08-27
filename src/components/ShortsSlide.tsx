"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getPublicFileUrl } from "@/lib/media-url";
import { reviewerNames, type Review } from "@/lib/data";
import AllCommentsClient from "./AllCommentsClient";
import { haptic } from "@/lib/haptics";
import { createClient } from "@/lib/supabase/client";

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
  const [commentCount, setCommentCount] = useState<number | null>(null);

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

  // Live comment count for the button. Recounts when the sheet closes so a
  // freshly posted comment is reflected.
  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    createClient()
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("slug", review.slug)
      .is("deleted_at", null)
      .then(({ count }) => {
        if (!cancelled) setCommentCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [inView, review.slug, showComments]);

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
          className="absolute inset-0 h-full w-full select-none object-contain"
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
          label={likes === null ? "" : String(likes)}
          onClick={() => handleReaction("like")}
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
              <path d="M2 21h4V9H2v12zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-5.15z" />
            </svg>
          }
        />
        <ActionButton
          active={userReaction === "dislike"}
          label={dislikes === null ? "" : String(dislikes)}
          onClick={() => handleReaction("dislike")}
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 rotate-180">
              <path d="M2 21h4V9H2v12zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-5.15z" />
            </svg>
          }
        />
        <ActionButton
          label={commentCount === null ? "" : String(commentCount)}
          onClick={() => setShowComments(true)}
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
            </svg>
          }
        />
        <ActionButton
          label="Share"
          onClick={handleShare}
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
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
          {/* Full-screen fixed backdrop: catches every touch so the video feed
              behind can't swipe to the next short while you're reading. */}
          <div
            className="fixed inset-0 z-[55] bg-black/50"
            onClick={() => setShowComments(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[60] flex h-[72vh] flex-col rounded-t-2xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 px-4 pt-2.5">
              <div className="mx-auto h-1 w-10 rounded-full bg-foreground/20" />
            </div>
            <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-2">
              <p className="font-display text-lg tracking-wide text-foreground">
                {commentCount !== null && commentCount > 0
                  ? `${commentCount} Comment${commentCount === 1 ? "" : "s"}`
                  : "Comments"}
              </p>
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
            <div className="border-t border-border" />
            <div
              className="flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-3"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <AllCommentsClient slug={review.slug} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
