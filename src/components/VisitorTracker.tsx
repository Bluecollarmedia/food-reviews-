"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Pings /api/track on each page view so the admin can see who's visiting.
 *
 * The site's server sits behind Netlify's edge, so it can't reliably see the
 * real visitor IP (it only sees Netlify's own machines). So the browser asks a
 * public "what's my IP" service directly — that request comes FROM the visitor,
 * so it sees the true address — and we pass that along. Falls back to whatever
 * the server can figure out if the lookup fails.
 */
async function lookupOwnIp(): Promise<string | undefined> {
  const providers = [
    { url: "https://api.ipify.org?format=json", key: "ip" },
    { url: "https://api64.ipify.org?format=json", key: "ip" },
  ];
  for (const p of providers) {
    try {
      const res = await fetch(p.url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      const ip = data?.[p.key];
      if (typeof ip === "string" && ip.length >= 7) return ip;
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

    (async () => {
      const ip = await lookupOwnIp();
      if (cancelled) return;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, ip }),
        keepalive: true,
      }).catch(() => {});
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
