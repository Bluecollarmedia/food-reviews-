import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  LOCKED_SESSION_COOKIE,
  LOCKED_SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { getLockedPasscode } from "@/lib/locked-passcode";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";
  const currentPasscode = await getLockedPasscode();

  if (!passcode || !currentPasscode || passcode !== currentPasscode) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

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
