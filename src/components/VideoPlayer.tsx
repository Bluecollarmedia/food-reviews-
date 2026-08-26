"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/use-supabase-user";

const HIDE_DELAY = 2200;

function formatTime(t: number) {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function VideoPlayer({
  src,
  poster,
  slug,
  reportDuration,
}: {
  src: string;
  poster?: string | null;
  slug?: string;
  /** When true, save this video's measured length to the review (once), so
   *  older videos get a duration badge on cards. Only pass for the review's
   *  main video. */
  reportDuration?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reportedDurationRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const { user } = useSupabaseUser();
  const lastReportRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function wakeControls() {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY);
  }

  useEffect(() => {
    if (!playing) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }
    wakeControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [playing]);

  function reportProgress(time: number, dur: number) {
    if (!slug || !user || !dur) return;
    const supabase = createClient();
    supabase
      .from("watch_history")
      .upsert(
        {
          user_id: user.id,
          slug,
          progress_seconds: time,
          duration_seconds: dur,
          watched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,slug" }
      )
      .then(() => {});
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const t = parseFloat(e.target.value);
    v.currentTime = t;
    setCurrent(t);
  }

  function enterFullscreen() {
    const v = videoRef.current as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-black shadow-lg"
      onMouseMove={wakeControls}
      onTouchStart={wakeControls}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        playsInline
        className="aspect-video w-full cursor-pointer"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={(e) => {
          setPlaying(false);
          reportProgress(e.currentTarget.currentTime, e.currentTarget.duration);
        }}
        onEnded={(e) => reportProgress(e.currentTarget.currentTime, e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime;
          setCurrent(time);
          if (time - lastReportRef.current >= 10) {
            lastReportRef.current = time;
            reportProgress(time, e.currentTarget.duration);
          }
        }}
        onLoadedMetadata={(e) => {
          const dur = e.currentTarget.duration;
          setDuration(dur);
          // Backfill the review's stored duration the first time its main video
          // is opened (the endpoint only writes if it isn't already known).
          if (reportDuration && slug && !reportedDurationRef.current && dur > 0) {
            reportedDurationRef.current = true;
            fetch(`/api/reviews/${slug}/duration`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ seconds: dur }),
            }).catch(() => {});
          }
        }}
      />

      {!playing && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform hover:scale-105">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-7 w-7">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={handleSeek}
          style={{ accentColor: "var(--primary)" }}
          className="h-1 w-full cursor-pointer"
        />
        <div className="mt-1.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
              {playing ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                  <path d="M16.5 12L20 15.5 18.6 17l-3.5-3.5L11.6 17 10 15.5l3.5-3.5L10 8.5 11.6 7l3.5 3.5L18.6 7 20 8.5z" />
                  <path d="M3 9v6h4l5 5V4L7 9H3z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
                  <path d="M3 9v6h4l5 5V4L7 9H3z" />
                  <path d="M16.5 12a4.5 4.5 0 00-2.5-4.03v8.06A4.5 4.5 0 0016.5 12z" />
                </svg>
              )}
            </button>
            <span className="text-[11px] tabular-nums text-white/80">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>
          <button onClick={enterFullscreen} aria-label="Fullscreen">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-[18px] w-[18px]"
            >
              <path
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m11-5v3a2 2 0 0 1-2 2h-3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
