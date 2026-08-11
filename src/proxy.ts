import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  ADMIN_SESSION_COOKIE,
  SETTINGS_SESSION_COOKIE,
  SITE_LOCK_SESSION_COOKIE,
  siteLockSecret,
  verifySessionToken,
} from "@/lib/session";

type Lock = { mode: "off" | "full" | "code"; passcodes: string[] };

// Small in-memory cache so the site-lock state isn't a database read on every
// single request. Toggling the lock takes effect within this window.
let lockCache: { value: Lock; at: number } | null = null;
const LOCK_TTL_MS = 10_000;

async function getSiteLock(): Promise<Lock> {
  const off: Lock = { mode: "off", passcodes: [] };
  if (lockCache && Date.now() - lockCache.at < LOCK_TTL_MS) return lockCache.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_settings?id=eq.1&select=site_lock_mode,site_lock_passcode,site_lock_passcode_2`,
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
    const passcodes = [row?.site_lock_passcode, row?.site_lock_passcode_2]
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean);
    const value: Lock = { mode, passcodes };
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

// Members-only mode toggle, cached and fetched independently.
let approvalCache: { value: boolean; at: number } | null = null;

async function getRequireApproval(): Promise<boolean> {
  if (approvalCache && Date.now() - approvalCache.at < LOCK_TTL_MS) return approvalCache.value;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_settings?id=eq.1&select=require_approval`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        },
      }
    );
    if (!res.ok) return false;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    const value = row?.require_approval === true;
    approvalCache = { value, at: Date.now() };
    return value;
  } catch {
    return false;
  }
}

// Is the current visitor a logged-in, approved account?
async function checkApprovedUser(req: NextRequest): Promise<"ok" | "login" | "pending"> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "login";
    const { data } = await supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", user.id)
      .single();
    // Only an explicitly-approved account gets in. Anything else — pending,
    // denied, or a missing/blank status — is held at the pending screen. (This
    // is a per-account decision, not the database-outage fail-open in catch.)
    return data?.approval_status === "approved" ? "ok" : "pending";
  } catch {
    // Fail OPEN: never lock everyone out on a hiccup.
    return "ok";
  }
}

// Known link-preview / social crawlers that fetch a page to build a share card.
// Deliberately excludes search-engine indexers (Googlebot/bingbot) — the site is
// noindex and members-only, so only share previews are allowed through.
function isPreviewBot(ua: string): boolean {
  return /facebookexternalhit|Facebot|Twitterbot|Slackbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Applebot|SkypeUriPreview|redditbot|Pinterest|vkShare|Embedly|Iframely|Google-InspectionTool|SnapchatAds|Snapchat/i.test(
    ua
  );
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

  // Link-preview crawlers (WhatsApp, iMessage, Facebook, etc.) fetch the page
  // logged-out to build the share card. If members-only mode or the site lock
  // redirected them to a login/lock screen, shared links would show no
  // thumbnail. Let these bots read the normal public page so previews work. The
  // video files themselves are public URLs regardless, so this exposes nothing
  // new — and real people still hit the gate.
  if (isPreviewBot(req.headers.get("user-agent") || "")) {
    return NextResponse.next();
  }

  // The lock/ban screens, the lock login, and the ban-appeal endpoints must
  // always be reachable — even by a banned visitor (that's the whole point of
  // letting them appeal or redeem an unban code).
  if (
    pathname === "/site-locked" ||
    pathname === "/banned" ||
    pathname.startsWith("/api/site-lock") ||
    pathname.startsWith("/api/appeal")
  ) {
    return NextResponse.next();
  }

  // Blocked visitors get the ban screen (with the owner's custom message),
  // before anything else on the public site. We block by DEVICE id (from the
  // cookie) — reliable even as the IP changes — and still by IP as a fallback.
  const banned = await getBannedIps();
  if (banned.length) {
    const ip = clientIp(req);
    const deviceId = req.cookies.get("dsfr_vid")?.value;
    if ((ip && banned.includes(ip)) || (deviceId && banned.includes(deviceId))) {
      const url = req.nextUrl.clone();
      url.pathname = "/banned";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

  // Members-only mode: the public site needs a logged-in, APPROVED account.
  // Auth pages and API routes are exempt (else you couldn't log in / sign up).
  const authPath =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/pending" ||
    pathname.startsWith("/reset-password");
  if (!pathname.startsWith("/api/") && !authPath) {
    if (await getRequireApproval()) {
      const status = await checkApprovedUser(req);
      if (status === "login") {
        const url = new URL("/login", req.url);
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
      if (status === "pending") {
        const url = req.nextUrl.clone();
        url.pathname = "/pending";
        url.search = "";
        return NextResponse.rewrite(url);
      }
    }
  }

  const lock = await getSiteLock();
  if (lock.mode === "off") return NextResponse.next();

  if (lock.mode === "code") {
    const token = req.cookies.get(SITE_LOCK_SESSION_COOKIE)?.value;
    if (await verifySessionToken(token, siteLockSecret(lock.passcodes))) {
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
