"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Pings /api/track on each page view so the admin can see who's visiting the
 * site. Fires only for real browser navigations (so JS-less bots are naturally
 * skipped) and never for the admin area.
 */
export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
