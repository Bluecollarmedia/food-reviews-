import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";

type Notification = {
  id: string;
  type: string;
  slug: string;
  comment_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
};

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path d="M9 17l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12h11a5 5 0 0 1 5 5v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function titleFor(type: string) {
  return type === "reply" ? "Replied to your comment" : "New activity";
}

function hrefFor(n: Notification) {
  return `/videos/${n.slug}`;
}

function NotificationCard({ n, unread }: { n: Notification; unread?: boolean }) {
  return (
    <Link
      href={hrefFor(n)}
      className={`group flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all active:scale-[0.99] ${
        unread
          ? "border-primary/30 bg-primary/5 hover:border-primary/60"
          : "border-border bg-surface hover:border-foreground/20"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          unread ? "bg-primary/15 text-primary" : "bg-surface-muted text-foreground/45"
        }`}
      >
        <ReplyIcon />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-foreground">{titleFor(n.type)}</span>
          {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className="mt-0.5 line-clamp-1 block text-sm text-foreground/60">{n.message}</span>
        <span className="mt-0.5 block text-xs text-foreground/40">{relativeTime(n.created_at)}</span>
      </span>

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-5 w-5 shrink-0 text-foreground/25 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/50"
      >
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/notifications");
  }

  const { data } = await supabase
    .from("notifications")
    .select("id, type, slug, comment_id, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const all = (data ?? []) as Notification[];
  // Split before marking read: this visit shows the just-arrived ones as "New"
  // and highlighted; on the next visit they'll have moved into "Earlier".
  const unread = all.filter((n) => !n.read);
  const earlier = all.filter((n) => n.read);

  if (unread.length > 0) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .in(
        "id",
        unread.map((n) => n.id)
      );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        Notifications
      </h1>

      {all.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-foreground/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="mt-4 font-semibold text-foreground">No notifications yet</p>
          <p className="mt-1 text-sm text-foreground/50">
            Replies to your comments will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {unread.length > 0 ? (
            <section>
              <h2 className="mb-2.5 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-primary">
                New
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unread.length}
                </span>
              </h2>
              <div className="flex flex-col gap-2.5">
                {unread.map((n) => (
                  <NotificationCard key={n.id} n={n} unread />
                ))}
              </div>
            </section>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-foreground">You&apos;re all caught up</p>
            </div>
          )}

          {earlier.length > 0 && (
            <details className="group" {...(unread.length === 0 ? { open: true } : {})}>
              <summary className="flex cursor-pointer list-none items-center justify-between px-1 text-xs font-bold uppercase tracking-wider text-foreground/45">
                <span>Earlier</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-4 w-4 transition-transform group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {earlier.map((n) => (
                  <NotificationCard key={n.id} n={n} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
