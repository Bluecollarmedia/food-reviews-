import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_SETTINGS_TAG } from "@/lib/site-settings";

function expiryFromDuration(duration: unknown): string | null {
  const now = Date.now();
  if (duration === "24h") return new Date(now + 24 * 60 * 60 * 1000).toISOString();
  if (duration === "1w") return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  return null; // "none" / anything else = stays until manually removed
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const emailNotifications = typeof body?.emailNotifications === "boolean" ? body.emailNotifications : false;
  const notifyEmail = typeof body?.notifyEmail === "string" ? body.notifyEmail.trim() : "";
  const lockedPasscode = typeof body?.lockedPasscode === "string" ? body.lockedPasscode.trim() : "";
  const vaultPasscode = typeof body?.vaultPasscode === "string" ? body.vaultPasscode.trim() : "";

  const bannerMessage = typeof body?.bannerMessage === "string" ? body.bannerMessage.trim() : "";
  const bannerDuration = body?.bannerDuration;

  const rawMode = body?.siteLockMode;
  const siteLockMode = rawMode === "full" || rawMode === "code" ? rawMode : "off";
  const siteLockPasscode = typeof body?.siteLockPasscode === "string" ? body.siteLockPasscode.trim() : "";

  if (siteLockMode === "code" && !siteLockPasscode) {
    return NextResponse.json(
      { error: "Enter a passcode to lock the site behind a code." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Bump the banner's version only when the message text actually changes, so
  // an unrelated settings save doesn't re-show a banner people already closed.
  const { data: existing } = await supabase
    .from("admin_settings")
    .select("banner_message, banner_updated_at")
    .eq("id", 1)
    .single();

  const messageChanged = (existing?.banner_message ?? "") !== bannerMessage;
  const bannerUpdatedAt = !bannerMessage
    ? existing?.banner_updated_at ?? null
    : messageChanged || !existing?.banner_updated_at
    ? new Date().toISOString()
    : existing.banner_updated_at;

  const { error } = await supabase
    .from("admin_settings")
    .update({
      email_notifications: emailNotifications,
      notify_email: notifyEmail || null,
      locked_passcode: lockedPasscode || null,
      locked_passcode_2: vaultPasscode || null,
      banner_message: bannerMessage || null,
      banner_expires_at: bannerMessage ? expiryFromDuration(bannerDuration) : null,
      banner_updated_at: bannerUpdatedAt,
      site_lock_mode: siteLockMode,
      site_lock_passcode: siteLockMode === "code" ? siteLockPasscode || null : null,
    })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag(SITE_SETTINGS_TAG, "max");
  return NextResponse.json({ ok: true });
}
