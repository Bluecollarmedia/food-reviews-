import AdminNav from "@/components/admin/AdminNav";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSettingsUnlocked } from "@/lib/settings-guard";
import { countNewAppeals } from "@/lib/appeals";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createAdminClient();
  const [unreadRes, unlocked, newAppeals] = await Promise.all([
    supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false),
    isSettingsUnlocked(),
    countNewAppeals().catch(() => 0),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav
        unreadNotifications={unreadRes.count ?? 0}
        newAppeals={newAppeals}
        unlocked={unlocked}
      />
      {children}
    </div>
  );
}
