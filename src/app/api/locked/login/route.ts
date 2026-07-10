import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  LOCKED_SESSION_COOKIE,
  LOCKED_SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";

  if (!passcode || passcode !== process.env.LOCKED_PASSCODE) {
    return NextResponse.json(
      {
        error: "Incorrect passcode.",
        debug: {
          received: passcode,
          expected: process.env.LOCKED_PASSCODE ?? "(unset)",
        },
      },
      { status: 401 }
    );
  }

  const token = await createSessionToken(
    process.env.LOCKED_PASSCODE ?? "",
    LOCKED_SESSION_MAX_AGE_SECONDS
  );
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
