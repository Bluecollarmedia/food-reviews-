"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import MobileNav from "./MobileNav";
import AuthStatus from "./AuthStatus";
import { NotificationBellDesktop, NotificationBellMobile } from "./NotificationBell";

export default function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Shorts is a full-screen, immersive feed (its own top bar / gestures), so
  // the site header would just steal space and break the app feel there.
  if (pathname?.startsWith("/admin") || pathname === "/site-locked" || pathname?.startsWith("/shorts"))
    return null;

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/brand/logo.webp"
            alt="D&S Food Reviews"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
            priority
          />
          <span className="font-display text-2xl tracking-wide text-foreground">
            D&amp;S Food Reviews
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/80 md:flex">
          <Link href="/reviews" className="transition-colors hover:text-primary">
            Reviews
          </Link>
          <Link href="/about" className="transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/locked" className="transition-colors hover:text-primary">
            Locked
          </Link>
          <Link href="/shorts" className="flex items-center gap-1.5 transition-colors hover:text-primary">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
            </svg>
            Shorts
          </Link>
          <NotificationBellDesktop />
          <AuthStatus />
        </nav>

        <NotificationBellMobile />
        <MobileNav />
      </div>
    </header>
  );
}
