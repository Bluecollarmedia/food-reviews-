import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  LOCKED_SESSION_COOKIE,
  LOCKED_SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { getLockedPasscode } from "@/lib/locked-passcode";
import { checkRateLimit, clearRateLimit, getClientIp, recordFailedAttempt } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rateLimitKey = `locked-login:${getClientIp(req)}`;
  const { allowed, retryAfterSeconds } = await checkRateLimit(rateLimitKey);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((retryAfterSeconds ?? 60) / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";
  const currentPasscode = await getLockedPasscode();

  if (!passcode || !currentPasscode || passcode !== currentPasscode) {
    await recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  await clearRateLimit(rateLimitKey);

  const token = await createSessionToken(currentPasscode, LOCKED_SESSION_MAX_AGE_SECONDS);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCKED_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: LOCKED_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
