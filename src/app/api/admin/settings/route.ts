import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const emailNotifications = typeof body?.emailNotifications === "boolean" ? body.emailNotifications : false;
  const notifyEmail = typeof body?.notifyEmail === "string" ? body.notifyEmail.trim() : "";
  const lockedPasscode = typeof body?.lockedPasscode === "string" ? body.lockedPasscode.trim() : "";
  const vaultPasscode = typeof body?.vaultPasscode === "string" ? body.vaultPasscode.trim() : "";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_settings")
    .update({
      email_notifications: emailNotifications,
      notify_email: notifyEmail || null,
      locked_passcode: lockedPasscode || null,
      locked_passcode_2: vaultPasscode || null,
    })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
