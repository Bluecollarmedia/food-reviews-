import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select(
      "email_notifications, notify_email, locked_passcode, banner_message, banner_expires_at, site_lock_mode, site_lock_passcode"
    )
    .eq("id", 1)
    .single();

  const mode = data?.site_lock_mode;
  const siteLockMode = mode === "full" || mode === "code" ? mode : "off";

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
        &larr; Back to admin
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground">Settings</h1>

      <AdminSettingsForm
        initialEmailNotifications={data?.email_notifications ?? false}
        initialNotifyEmail={data?.notify_email ?? ""}
        initialLockedPasscode={data?.locked_passcode ?? process.env.LOCKED_PASSCODE ?? ""}
        initialBannerMessage={data?.banner_message ?? ""}
        initialBannerExpiresAt={data?.banner_expires_at ?? null}
        initialSiteLockMode={siteLockMode}
        initialSiteLockPasscode={data?.site_lock_passcode ?? ""}
      />
    </div>
  );
}
