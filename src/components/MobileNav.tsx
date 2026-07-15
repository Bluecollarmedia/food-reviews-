"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AuthLinks, AuthSessionAction } from "./AuthStatus";
import { useSupabaseUser } from "@/lib/use-supabase-user";

const linkClass =
  "flex items-center gap-4 py-3 font-display text-3xl tracking-wide text-foreground transition-colors hover:text-primary";

const reviewsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
  </svg>
);

const lockedIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const aboutIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.01" strokeLinecap="round" />
  </svg>
);

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, displayName, avatarUrl } = useSupabaseUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const items = [
    { href: "/reviews", label: "Reviews", icon: reviewsIcon },
    { href: "/locked", label: "Locked", icon: lockedIcon },
  ];

  return (
    <div className="md:hidden">
      {mounted &&
        createPortal(
          <>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="fixed right-5 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90 md:hidden"
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

            <div
              className={`fixed inset-0 z-50 flex flex-col bg-background transition-all duration-[250ms] ease-out md:hidden ${
                open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
              }`}
            >
              <div className="h-16 shrink-0" />
              <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-6 pt-6 pb-16">
                {user && (
                  <div
                    className={`mb-6 flex items-center gap-3 transition-all duration-300 ${
                      open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                    }`}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={displayName ?? ""} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light font-display text-lg text-white">
                        {(displayName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{displayName}</p>
                      <p className="text-xs text-foreground/50">Logged in</p>
                    </div>
                  </div>
                )}

                {items.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`${linkClass} transition-all duration-500 ${
                      open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                    }`}
                    style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }}
                  >
                    <span className="text-primary">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                <div
                  className={`transition-all duration-500 ${
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${items.length * 60}ms` : "0ms" }}
                >
                  <AuthLinks variant="fullscreen" onNavigate={() => setOpen(false)} />
                </div>

                <Link
                  href="/about"
                  onClick={() => setOpen(false)}
                  className={`${linkClass} transition-all duration-500 ${
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${(items.length + 1) * 60}ms` : "0ms" }}
                >
                  <span className="text-primary">{aboutIcon}</span>
                  About
                </Link>

                <div
                  className={`transition-all duration-500 ${
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${(items.length + 2) * 60}ms` : "0ms" }}
                >
                  <AuthSessionAction variant="fullscreen" onNavigate={() => setOpen(false)} />
                </div>
              </div>

              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={`absolute bottom-6 left-6 text-xs font-medium text-foreground/30 transition-all duration-500 hover:text-foreground/60 ${
                  open ? "opacity-100" : "opacity-0"
                }`}
              >
                Admin
              </Link>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
