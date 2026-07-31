import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  LOCKED_SESSION_COOKIE,
  VAULT_SESSION_COOKIE,
  VAULT_SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/session";
import { getLockedPasscode, getVaultPasscode } from "@/lib/locked-passcode";
import { checkRateLimit, clearRateLimit, getClientIp, recordFailedAttempt } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // The Vault sits inside Locked — you must already be past the regular Locked
  // passcode before a Vault passcode is even accepted.
  const lockedToken = req.cookies.get(LOCKED_SESSION_COOKIE)?.value;
  const hasLockedAccess = await verifySessionToken(lockedToken, await getLockedPasscode());
  if (!hasLockedAccess) {
    return NextResponse.json({ error: "Unlock the Locked section first." }, { status: 401 });
  }

  const rateLimitKey = `vault-login:${getClientIp(req)}`;
  const { allowed, retryAfterSeconds } = await checkRateLimit(rateLimitKey);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((retryAfterSeconds ?? 60) / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";
  const currentPasscode = await getVaultPasscode();

  if (!passcode || !currentPasscode || passcode !== currentPasscode) {
    await recordFailedAttempt(rateLimitKey);
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  await clearRateLimit(rateLimitKey);

  const token = await createSessionToken(currentPasscode, VAULT_SESSION_MAX_AGE_SECONDS);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VAULT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: VAULT_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
