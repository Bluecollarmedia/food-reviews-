"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VID_KEY = "dsfr_vid";

// A stable per-browser id so one device is ONE visitor in the log, even when its
// IP keeps changing (which cellular does constantly). Also mirrored into a
// cookie so the middleware can block a banned device before any page loads —
// far more reliable than banning an ever-changing IP.
function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VID_KEY, id);
    }
    // Keep the cookie in sync (1 year) so the server sees the device id too.
    document.cookie = `${VID_KEY}=${id}; path=/; max-age=31536000; samesite=lax`;
    return id;
  } catch {
    return "";
  }
}

// The server sits behind Netlify's edge and can't see the real client IP, so
// the browser looks it up itself (this request comes FROM the visitor).
async function lookupOwnIp(): Promise<string | undefined> {
  const urls = ["https://api.ipify.org?format=json", "https://api64.ipify.org?format=json"];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      if (typeof data?.ip === "string" && data.ip.length >= 7) return data.ip;
    } catch {
      // try the next provider
    }
  }
  return undefined;
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    let cancelled = false;
    const vid = getVisitorId();

    (async () => {
      const ip = await lookupOwnIp();
      if (cancelled) return;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, ip, vid }),
        keepalive: true,
      }).catch(() => {});
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
