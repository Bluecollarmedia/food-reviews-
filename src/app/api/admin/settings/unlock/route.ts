import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  SETTINGS_SESSION_COOKIE,
  SETTINGS_SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { getSettingsPasscode } from "@/lib/locked-passcode";
import { checkRateLimit, clearRateLimit, getClientIp, recordFailedAttempt } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rateLimitKey = `settings-unlock:${getClientIp(req)}`;
  const { allowed, retryAfterSeconds } = await checkRateLimit(rateLimitKey);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((retryAfterSeconds ?? 60) / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";
  const currentPasscode = await getSettingsPasscode();

  // No security passcode configured yet — leave it open so it can be set for the first time.
  if (currentPasscode && (!passcode || passcode !== currentPasscode)) {
    await recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  await clearRateLimit(rateLimitKey);

  const token = await createSessionToken(currentPasscode || "unset", SETTINGS_SESSION_MAX_AGE_SECONDS);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SETTINGS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SETTINGS_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
