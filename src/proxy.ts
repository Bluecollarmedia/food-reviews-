import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  SITE_LOCK_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/session";

type Lock = { mode: "off" | "full" | "code"; passcode: string };

// Small in-memory cache so the site-lock state isn't a database read on every
// single request. Toggling the lock takes effect within this window.
let lockCache: { value: Lock; at: number } | null = null;
const LOCK_TTL_MS = 10_000;

async function getSiteLock(): Promise<Lock> {
  const off: Lock = { mode: "off", passcode: "" };
  if (lockCache && Date.now() - lockCache.at < LOCK_TTL_MS) return lockCache.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_settings?id=eq.1&select=site_lock_mode,site_lock_passcode`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        },
      }
    );
    if (!res.ok) return off;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    const mode =
      row?.site_lock_mode === "full" || row?.site_lock_mode === "code"
        ? row.site_lock_mode
        : "off";
    const value: Lock = { mode, passcode: row?.site_lock_passcode ?? "" };
    lockCache = { value, at: Date.now() };
    return value;
  } catch {
    // Fail OPEN: a database hiccup must never lock the entire site by accident.
    return off;
  }
}

// Banned IPs, cached and fetched independently of the site lock so a missing
// column (e.g. before the ban SQL is run) can never disturb the lock.
let banCache: { value: string[]; at: number } | null = null;

async function getBannedIps(): Promise<string[]> {
  if (banCache && Date.now() - banCache.at < LOCK_TTL_MS) return banCache.value;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_settings?id=eq.1&select=banned_ips`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        },
      }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    const ips = Array.isArray(row?.banned_ips)
      ? (row.banned_ips as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    banCache = { value: ips, at: Date.now() };
    return ips;
  } catch {
    // Fail OPEN: never accidentally block everyone on a database hiccup.
    return [];
  }
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Admin area: its own auth, and ALWAYS reachable (even during a site
  // lockdown) so the owner can never be locked out of turning the lock off. ---
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login" || pathname === "/api/admin/login") {
      return NextResponse.next();
    }
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const valid = await verifySessionToken(token, process.env.ADMIN_PASSWORD ?? "");
    if (valid) return NextResponse.next();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Anyone logged into admin bypasses the lock everywhere, so the owner can
  // preview the public site while it's locked to everyone else.
  const adminToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await verifySessionToken(adminToken, process.env.ADMIN_PASSWORD ?? "")) {
    return NextResponse.next();
  }

  // The lock/ban screens and the lock login endpoint must always be reachable.
  if (
    pathname === "/site-locked" ||
    pathname === "/banned" ||
    pathname.startsWith("/api/site-lock")
  ) {
    return NextResponse.next();
  }

  // Blocked IPs get the ban screen (with the owner's custom message), before
  // anything else on the public site.
  const ip = clientIp(req);
  if (ip) {
    const banned = await getBannedIps();
    if (banned.includes(ip)) {
      const url = req.nextUrl.clone();
      url.pathname = "/banned";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

  const lock = await getSiteLock();
  if (lock.mode === "off") return NextResponse.next();

  if (lock.mode === "code") {
    const token = req.cookies.get(SITE_LOCK_SESSION_COOKIE)?.value;
    if (await verifySessionToken(token, lock.passcode || "site-lock")) {
      return NextResponse.next();
    }
  }

  // Full lockdown, or code mode without a valid pass — show the lock screen.
  const url = req.nextUrl.clone();
  url.pathname = "/site-locked";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  // Run on everything except Next internals and public static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|icons/|images/).*)",
  ],
};
