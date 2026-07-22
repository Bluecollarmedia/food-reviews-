import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SETTINGS_SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getSettingsPasscode } from "@/lib/locked-passcode";

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const emailNotifications = typeof body?.emailNotifications === "boolean" ? body.emailNotifications : false;
  const notifyEmail = typeof body?.notifyEmail === "string" ? body.notifyEmail.trim() : "";

  const wantsSecurityFields =
    body?.lockedPasscode !== undefined ||
    body?.vaultPasscode !== undefined ||
    body?.settingsPasscode !== undefined;

  const update: Record<string, unknown> = {
    email_notifications: emailNotifications,
    notify_email: notifyEmail || null,
  };

  if (wantsSecurityFields) {
    const currentSettingsPasscode = await getSettingsPasscode();
    // If no security passcode is configured yet, allow it to be set for the first time.
    if (currentSettingsPasscode) {
      const token = req.cookies.get(SETTINGS_SESSION_COOKIE)?.value;
      const valid = await verifySessionToken(token, currentSettingsPasscode);
      if (!valid) {
        return NextResponse.json({ error: "Security passcode required." }, { status: 403 });
      }
    }

    const lockedPasscode = typeof body?.lockedPasscode === "string" ? body.lockedPasscode.trim() : "";
    const vaultPasscode = typeof body?.vaultPasscode === "string" ? body.vaultPasscode.trim() : "";
    const settingsPasscode = typeof body?.settingsPasscode === "string" ? body.settingsPasscode.trim() : "";

    update.locked_passcode = lockedPasscode || null;
    update.locked_passcode_2 = vaultPasscode || null;
    update.settings_passcode = settingsPasscode || null;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_settings").update(update).eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
