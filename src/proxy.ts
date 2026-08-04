import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  SETTINGS_SESSION_COOKIE,
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

function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

function clientIp(req: NextRequest): string {
  // Netlify's edge header is the authoritative client IP; the others are
  // fallbacks for other CDNs. As a last resort, take the first public entry
  // from x-forwarded-for (the left-most is the original client).
  const direct =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("true-client-ip") ||
    req.headers.get("x-real-ip");
  if (direct && !isPrivateIp(direct.trim())) return direct.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    for (const part of forwarded.split(",")) {
      const ip = part.trim();
      if (ip && !isPrivateIp(ip)) return ip;
    }
  }
  return direct?.trim() || "";
}

// The separate "security passcode": with just the shared admin code you can
// only manage reviews and upload. Everything else in the admin panel needs
// this. Cached, and read on its own so a failure can't disturb anything else.
let secCache: { value: string; at: number } | null = null;

async function getSecurityPasscode(): Promise<string> {
  if (secCache && Date.now() - secCache.at < LOCK_TTL_MS) return secCache.value;
  const fallback = process.env.SETTINGS_PASSCODE ?? "";
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_settings?id=eq.1&select=settings_passcode`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        },
      }
    );
    if (!res.ok) return fallback;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    const value = row?.settings_passcode || fallback;
    secCache = { value, at: Date.now() };
    return value;
  } catch {
    return fallback;
  }
}

// Areas a co-admin (shared admin code only) is allowed into: reviews + upload,
// plus the pages/endpoints needed to unlock the rest. Everything else under
// /admin is gated behind the security passcode. Whitelist, so anything new is
// protected by default.
function isBasicAdminPath(pathname: string): boolean {
  if (pathname === "/admin" || pathname === "/admin/new" || pathname === "/admin/unlock") {
    return true;
  }
  if (/^\/admin\/[^/]+\/edit$/.test(pathname)) return true;
  if (pathname === "/api/admin/reviews" || pathname.startsWith("/api/admin/reviews/")) {
    return true;
  }
  if (pathname === "/api/admin/upload-url") return true;
  if (pathname === "/api/admin/views") return true;
  if (pathname === "/api/admin/settings/unlock") return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The visitor tracker (/api/track) runs as a serverless function BEHIND the
  // edge, where the real client IP has already been replaced by an internal
  // Netlify/AWS hop. Here in the middleware we're AT the edge and still see the
  // true visitor IP — so grab it and forward it to the route in a header it can
  // trust. (Done first so it works even for admins, who bypass the rest below.)
  if (pathname === "/api/track") {
    const realIp = clientIp(req);
    const headers = new Headers(req.headers);
    if (realIp) headers.set("x-visitor-ip", realIp);
    return NextResponse.next({ request: { headers } });
  }

  // --- Admin area: its own auth, and ALWAYS reachable (even during a site
  // lockdown) so the owner can never be locked out of turning the lock off. ---
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login" || pathname === "/api/admin/login") {
      return NextResponse.next();
    }
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const valid = await verifySessionToken(token, process.env.ADMIN_PASSWORD ?? "");
    if (!valid) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Logged in with the shared admin code. Everything beyond reviews/upload
    // needs the separate security passcode on top.
    if (!isBasicAdminPath(pathname)) {
      const securityPass = await getSecurityPasscode();
      if (securityPass) {
        const settingsToken = req.cookies.get(SETTINGS_SESSION_COOKIE)?.value;
        if (!(await verifySessionToken(settingsToken, securityPass))) {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              { error: "This area needs the security passcode." },
              { status: 403 }
            );
          }
          const unlockUrl = new URL("/admin/unlock", req.url);
          unlockUrl.searchParams.set("redirect", pathname);
          return NextResponse.redirect(unlockUrl);
        }
      }
    }

    return NextResponse.next();
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
