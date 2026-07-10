"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/80 hover:text-primary"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            <Link
              href="/reviews"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-foreground/80 hover:bg-surface-muted hover:text-primary"
            >
              Reviews
            </Link>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-foreground/80 hover:bg-surface-muted hover:text-primary"
            >
              About
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
