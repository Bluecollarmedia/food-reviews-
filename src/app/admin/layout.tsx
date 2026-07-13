import AdminNav from "@/components/admin/AdminNav";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createAdminClient();
  const { count: unreadNotifications } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav unreadNotifications={unreadNotifications ?? 0} />
      {children}
    </div>
  );
}
