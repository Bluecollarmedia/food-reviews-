"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { relativeTime } from "@/lib/time";
import HistoryVideoRow from "@/components/HistoryVideoRow";
import AccountSettingsPanel from "@/components/AccountSettingsPanel";
import type { Review } from "@/lib/data";

type Tab = "notifications" | "history" | "settings";

type NotificationRow = {
  id: string;
  type: string;
  slug: string;
  comment_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
};

function NotificationsTab({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id, type, slug, comment_id, message, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(async ({ data }: { data: NotificationRow[] | null }) => {
        if (cancelled) return;
        setNotifications(data ?? []);
        const unreadIds = (data ?? []).filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length > 0) {
          await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (notifications === null) {
    return <p className="text-sm text-foreground/60">Loading...</p>;
  }

  if (notifications.length === 0) {
    return <p className="text-center text-foreground/60">No notifications yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {notifications.map((n) => (
        <li key={n.id}>
          <Link
            href={
              n.comment_id
                ? `/videos/${n.slug}/comments#comment-${n.comment_id}`
                : `/videos/${n.slug}`
            }
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
  );
}

function HistoryTab() {
  const [data, setData] = useState<{ reviews: Review[]; progress: Record<string, number> } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/watch-history")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (data === null) {
    return <p className="text-sm text-foreground/60">Loading...</p>;
  }

  if (data.reviews.length === 0) {
    return <p className="text-center text-foreground/60">You haven&apos;t watched any reviews yet.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {data.reviews.map((review) => (
        <HistoryVideoRow
          key={review.slug}
          review={review}
          progressPercent={data.progress[review.slug]}
        />
      ))}
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "notifications", label: "Notifications" },
  { key: "history", label: "Watch History" },
  { key: "settings", label: "Settings" },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [tab, setTab] = useState<Tab>("notifications");

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login?redirect=/account");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">Account</h1>

      <div className="mt-5 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-b-2 border-primary text-primary"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "notifications" && <NotificationsTab userId={user.id} />}
        {tab === "history" && <HistoryTab />}
        {tab === "settings" && <AccountSettingsPanel />}
      </div>
    </div>
  );
}
