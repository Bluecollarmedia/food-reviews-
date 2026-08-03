"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * A full-screen, branded announcement takeover shown when the visitor opens
 * the site. Dismissible per visitor: a dismissal is remembered against the
 * announcement's version, so editing the message brings it back for everyone,
 * but an untouched one stays dismissed once someone continues past it.
 */
export default function AnnouncementScreen({
  message,
  version,
}: {
  message: string;
  version: string;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("banner-dismissed");
    setDismissed(stored === version);
  }, [version]);

  useEffect(() => {
    if (dismissed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dismissed]);

  if (dismissed) return null;

  function handleDismiss() {
    window.localStorage.setItem("banner-dismissed", version);
    setDismissed(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-background px-6 py-12 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(200,16,46,0.12),transparent_62%)]" />

      <div className="relative flex w-full max-w-lg flex-col items-center">
        <Image
          src="/images/brand/logo.webp"
          alt="D&S Food Reviews"
          width={92}
          height={92}
          priority
          className="h-[92px] w-[92px] rounded-full shadow-lg ring-2 ring-primary/30 ring-offset-4 ring-offset-background"
        />
        <h1 className="mt-5 font-display text-3xl tracking-wide text-foreground sm:text-4xl">
          D&amp;S Food Reviews
        </h1>

        <span className="mt-4 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
          Announcement
        </span>

        <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-foreground/85 sm:text-xl">
          {message}
        </p>

        <button
          onClick={handleDismiss}
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          Continue to the site
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
