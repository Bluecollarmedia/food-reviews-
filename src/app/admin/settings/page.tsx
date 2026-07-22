import Link from "next/link";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { SETTINGS_SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("email_notifications, notify_email, locked_passcode, locked_passcode_2, settings_passcode")
    .eq("id", 1)
    .single();

  const settingsPasscode = data?.settings_passcode || process.env.SETTINGS_PASSCODE || "";

  // Not configured yet — leave the security fields open so it can be set for the first time.
  let unlocked = !settingsPasscode;
  if (!unlocked) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SETTINGS_SESSION_COOKIE)?.value;
    unlocked = await verifySessionToken(token, settingsPasscode);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
        &larr; Back to admin
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground">Settings</h1>

      <AdminSettingsForm
        initialEmailNotifications={data?.email_notifications ?? false}
        initialNotifyEmail={data?.notify_email ?? ""}
        initialUnlocked={unlocked}
        initialLockedPasscode={unlocked ? data?.locked_passcode ?? process.env.LOCKED_PASSCODE ?? "" : ""}
        initialVaultPasscode={unlocked ? data?.locked_passcode_2 ?? process.env.VAULT_PASSCODE ?? "" : ""}
        initialSettingsPasscode={unlocked ? settingsPasscode : ""}
      />
    </div>
  );
}
