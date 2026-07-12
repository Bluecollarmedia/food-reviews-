"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import AuthStatus from "./AuthStatus";

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
              className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80%] flex-col divide-y divide-border overflow-y-auto bg-surface shadow-xl transition-transform duration-300 ease-out ${
                open ? "translate-x-0" : "pointer-events-none translate-x-full"
              }`}
            >
              <div className="h-16 shrink-0" />
              <Link href="/reviews" onClick={() => setOpen(false)} className={linkClass}>
                Reviews
              </Link>
              <Link href="/about" onClick={() => setOpen(false)} className={linkClass}>
                About
              </Link>
              <Link href="/locked" onClick={() => setOpen(false)} className={linkClass}>
                Locked
              </Link>
              <AuthStatus variant="mobile" onNavigate={() => setOpen(false)} />
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
