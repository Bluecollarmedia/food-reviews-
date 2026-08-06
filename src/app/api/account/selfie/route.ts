import { NextRequest, NextResponse } from "next/server";
import { putObject } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";

const SELFIE_LIMIT = { maxAttempts: 10, windowMs: 60 * 60 * 1000 }; // 10 per hour per IP

// Stores the verification selfie captured during signup. Public (the account
// isn't logged in yet when email confirmation is on), but rate-limited and
// write-once: it only sets selfie_key when the profile doesn't already have one,
// so it can't be used to overwrite someone else's selfie.
export async function POST(req: NextRequest) {
  const key = `signup-selfie:${getClientIp(req)}`;
  const { allowed } = await checkRateLimit(key, SELFIE_LIMIT);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  await recordFailedAttempt(key, SELFIE_LIMIT);

  const body = (await req.json().catch(() => null)) as
    | { userId?: string; selfie?: string }
    | null;

  const userId = (body?.userId ?? "").trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const selfie = body?.selfie ?? "";
  const m = selfie.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) {
    return NextResponse.json({ error: "No selfie." }, { status: 400 });
  }

  let selfieKey: string;
  try {
    const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    if (bytes.length > 6_000_000) {
      return NextResponse.json({ error: "Selfie too large." }, { status: 400 });
    }
    selfieKey = `selfies/${userId}-${Date.now()}.${ext}`;
    await putObject(selfieKey, bytes, m[1]);
  } catch {
    return NextResponse.json({ error: "Couldn't save the selfie." }, { status: 500 });
  }

  const supabase = createAdminClient();
  // Write-once: only claim the slot if it's still empty.
  await supabase
    .from("profiles")
    .update({ selfie_key: selfieKey })
    .eq("id", userId)
    .is("selfie_key", null);

  return NextResponse.json({ ok: true });
}
