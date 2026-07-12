import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/notifications");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, slug, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const unreadIds = (notifications ?? []).filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length > 0) {
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        Notifications
      </h1>

      {!notifications || notifications.length === 0 ? (
        <p className="mt-12 text-center text-foreground/60">No notifications yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={`/videos/${n.slug}`}
                className={`block rounded-2xl border p-4 transition-colors hover:border-primary ${
                  n.read ? "border-border bg-surface" : "border-primary bg-primary/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {n.type === "reply" ? "Someone replied to your comment" : "New activity"}
                  </span>
                  <span className="text-xs text-foreground/40">{relativeTime(n.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/70">{n.message}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
