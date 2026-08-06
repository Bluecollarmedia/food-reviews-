import { NextRequest, NextResponse } from "next/server";
import { putObject } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";

const SELFIE_LIMIT = { maxAttempts: 10, windowMs: 60 * 60 * 1000 }; // 10 per hour per IP

// Decode a base64 image data URL and push it to R2, returning the object key.
async function saveDataUrl(dataUrl: string, folder: string, userId: string): Promise<string | null> {
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return null;
  try {
    const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    if (bytes.length > 6_000_000) return null;
    const key = `${folder}/${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    await putObject(key, bytes, m[1]);
    return key;
  } catch {
    return null;
  }
}

// Stores the signup media (verification selfie, and now the required profile
// picture) against a new account. Public — the account isn't logged in yet when
// email confirmation is on — but rate-limited and write-once: each field is only
// set when the profile doesn't already have one, so it can't overwrite someone
// else's selfie or avatar.
export async function POST(req: NextRequest) {
  const key = `signup-selfie:${getClientIp(req)}`;
  const { allowed } = await checkRateLimit(key, SELFIE_LIMIT);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  await recordFailedAttempt(key, SELFIE_LIMIT);

  const body = (await req.json().catch(() => null)) as
    | { userId?: string; selfie?: string; avatar?: string }
    | null;

  const userId = (body?.userId ?? "").trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(userId)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const selfieKey = body?.selfie ? await saveDataUrl(body.selfie, "selfies", userId) : null;
  const avatarKey = body?.avatar ? await saveDataUrl(body.avatar, "avatars", userId) : null;

  if (!selfieKey && !avatarKey) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  const supabase = createAdminClient();
  // Write-once per field: only claim a slot that's still empty.
  if (selfieKey) {
    await supabase.from("profiles").update({ selfie_key: selfieKey }).eq("id", userId).is("selfie_key", null);
  }
  if (avatarKey) {
    await supabase.from("profiles").update({ avatar_key: avatarKey }).eq("id", userId).is("avatar_key", null);
  }

  return NextResponse.json({ ok: true });
}
