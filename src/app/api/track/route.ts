import { NextRequest, NextResponse } from "next/server";
import { recordVisit } from "@/lib/visitors";
import { getClientIp, checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";

// Cap how many pings a single IP can log in a short window. This kills both
// endpoint spam and rapid refresh flooding while leaving normal browsing (a
// handful of page views a minute) completely untouched.
const TRACK_LIMIT = { maxAttempts: 30, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  let path = "/";
  try {
    const body = await req.json();
    if (typeof body?.path === "string") path = body.path;
  } catch {
    // no body / bad JSON — just log the visit with a default path
  }

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
