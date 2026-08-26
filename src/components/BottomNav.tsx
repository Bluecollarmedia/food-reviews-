"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { haptic } from "@/lib/haptics";

type Tab = { href: string; label: string; icon: React.ReactNode; match: (p: string) => boolean };

const iconCls = "h-6 w-6";

const TABS: Tab[] = [
  {
    href: "/",
    label: "Home",
    match: (p) => p === "/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconCls}>
        <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/rankings",
    label: "Rankings",
    match: (p) => p.startsWith("/rankings"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconCls}>
        <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 5h2.5a1.5 1.5 0 0 1 0 4H17M7 5H4.5a1.5 1.5 0 0 0 0 4H7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/shorts",
    label: "Shorts",
    match: (p) => p.startsWith("/shorts"),
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={iconCls}>
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Account",
    match: (p) => p.startsWith("/account") || p.startsWith("/settings") || p.startsWith("/history"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconCls}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname() || "/";
  const hidden = pathname.startsWith("/admin") || pathname === "/site-locked";

  // Reserve space at the bottom of the page only while the bar is showing.
  useEffect(() => {
    if (hidden) return;
    document.body.classList.add("has-bottom-nav");
    return () => document.body.classList.remove("has-bottom-nav");
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => {
                haptic("light");
                // Tapping the tab you're already on scrolls back to the top
                // (like the native apps do), instead of doing nothing.
                if (active) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors active:scale-95 ${
                active ? "text-primary" : "text-foreground/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
