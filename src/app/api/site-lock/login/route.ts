import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  siteLockSecret,
  SITE_LOCK_SESSION_COOKIE,
  SITE_LOCK_SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { getSiteLockMode, getSiteLockPasscodes } from "@/lib/site-settings";
import { checkRateLimit, clearRateLimit, getClientIp, recordFailedAttempt } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rateLimitKey = `site-lock:${getClientIp(req)}`;
  const { allowed, retryAfterSeconds } = await checkRateLimit(rateLimitKey);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((retryAfterSeconds ?? 60) / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const mode = await getSiteLockMode();
  if (mode !== "code") {
    // Not in code mode — nothing to unlock with a passcode.
    return NextResponse.json({ error: "The site isn't accepting a passcode right now." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";
  const passcodes = await getSiteLockPasscodes();

  if (!passcode || !passcodes.includes(passcode)) {
    await recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  await clearRateLimit(rateLimitKey);

  // Sign with the combined secret so a session from EITHER passcode verifies.
  const token = await createSessionToken(siteLockSecret(passcodes), SITE_LOCK_SESSION_MAX_AGE_SECONDS);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SITE_LOCK_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SITE_LOCK_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
