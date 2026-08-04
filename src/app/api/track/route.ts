import { NextRequest, NextResponse } from "next/server";
import { recordVisit } from "@/lib/visitors";
import { getClientIp, checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";

// Cap how many pings a single IP can log in a short window. This kills both
// endpoint spam and rapid refresh flooding while leaving normal browsing (a
// handful of page views a minute) completely untouched.
const TRACK_LIMIT = { maxAttempts: 30, windowMs: 60_000 };

function isValidPublicIp(ip: string): boolean {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = ip.match(v4);
  if (m) {
    if (m.slice(1).some((o) => Number(o) > 255)) return false;
    // Reject obvious non-public ranges.
    if (
      ip.startsWith("10.") ||
      ip.startsWith("127.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
    ) {
      return false;
    }
    return true;
  }
  // Loose IPv6 check.
  return ip.includes(":") && /^[0-9a-fA-F:.]+$/.test(ip) && ip.length >= 3;
}

export async function POST(req: NextRequest) {
  let path = "/";
  let reportedIp = "";
  try {
    const body = await req.json();
    if (typeof body?.path === "string") path = body.path;
    if (typeof body?.ip === "string") reportedIp = body.ip.trim();
  } catch {
    // no body / bad JSON — just log the visit with a default path
  }

  // Prefer the IP the browser looked up for itself (it can see the real client
  // address the server can't). Fall back to the edge-forwarded header, then to
  // whatever the server can read directly.
  const ip =
    (reportedIp && isValidPublicIp(reportedIp) && reportedIp) ||
    req.headers.get("x-visitor-ip")?.trim() ||
    getClientIp(req);

  // The admin panel isn't a "visitor to the website" — don't log it.
  if (path.startsWith("/admin")) {
    return NextResponse.json({ ok: true });
  }

  // Too many pings from this IP this minute — drop it silently.
  const key = `track:${ip}`;
  const { allowed } = await checkRateLimit(key, TRACK_LIMIT);
  if (!allowed) {
    return NextResponse.json({ ok: true });
  }
  await recordFailedAttempt(key, TRACK_LIMIT);

  await recordVisit(ip, path).catch(() => {});
  return NextResponse.json({ ok: true });
}
