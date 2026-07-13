"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AuthLinks, AuthSessionAction } from "./AuthStatus";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const linkClass =
    "block px-5 py-4 text-base font-semibold text-foreground/80 transition-colors hover:bg-surface-muted hover:text-primary";

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90"
      >
        <span
          className={`absolute inset-0 rounded-full bg-primary transition-all duration-300 ease-out ${
            open ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        />
        <span
          className={`relative block h-4 w-6 transition-transform duration-300 ease-out ${
            open ? "rotate-[180deg]" : "rotate-0"
          }`}
        >
          <span
            className={`absolute left-0 h-0.5 w-6 rounded-full transition-all duration-300 ease-in-out ${
              open ? "top-[7px] rotate-45 bg-white" : "top-0 rotate-0 bg-foreground/80"
            }`}
          />
          <span
            className={`absolute left-0 top-[7px] h-0.5 w-6 rounded-full transition-all duration-200 ease-in-out ${
              open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100 bg-foreground/80"
            }`}
          />
          <span
            className={`absolute left-0 h-0.5 w-6 rounded-full transition-all duration-300 ease-in-out ${
              open ? "top-[7px] -rotate-45 bg-white" : "top-[14px] rotate-0 bg-foreground/80"
            }`}
          />
        </span>
      </button>

      {mounted &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              onClick={() => setOpen(false)}
            />

            <div
              className={`fixed inset-y-0 right-0 z-50 flex w-64 max-w-[75%] flex-col overflow-y-auto bg-surface shadow-xl transition-transform duration-300 ease-out ${
                open ? "translate-x-0" : "pointer-events-none translate-x-full"
              }`}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
                <span className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-surface-muted hover:text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col divide-y divide-border">
                <Link href="/reviews" onClick={() => setOpen(false)} className={linkClass}>
                  Reviews
                </Link>
                <Link href="/locked" onClick={() => setOpen(false)} className={linkClass}>
                  Locked
                </Link>
                <AuthLinks variant="mobile" onNavigate={() => setOpen(false)} />
                <Link href="/about" onClick={() => setOpen(false)} className={linkClass}>
                  About
                </Link>
                <AuthSessionAction variant="mobile" onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
