import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("email_notifications, notify_email")
    .eq("id", 1)
    .single();

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
        &larr; Back to admin
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground">Settings</h1>

      <AdminSettingsForm
        initialEmailNotifications={data?.email_notifications ?? false}
        initialNotifyEmail={data?.notify_email ?? ""}
      />
    </div>
  );
}
