import Link from "next/link";
import { listAllReviews } from "@/lib/reviews-store";
import { getAllViews } from "@/lib/views";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminReviewCard from "@/components/admin/AdminReviewCard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const reviews = await listAllReviews();
  const views = await getAllViews(reviews.map((r) => r.slug));

  const supabase = createAdminClient();
  const { count: unreadCount } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-wide text-foreground">
          Admin &middot; Reviews
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/notifications"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/70 hover:border-primary hover:text-primary"
          >
            Notifications{unreadCount ? ` (${unreadCount})` : ""}
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/70 hover:border-primary hover:text-primary"
          >
            Settings
          </Link>
          <Link
            href="/admin/new"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            + Add New Review
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {reviews.map((r) => (
          <AdminReviewCard key={r.slug} review={r} views={views[r.slug] ?? 0} />
        ))}

        {reviews.length === 0 && (
          <p className="mt-8 text-center text-foreground/60">
            No reviews yet — tap &quot;Add New Review&quot; to create the first one.
          </p>
        )}
      </div>
    </div>
  );
}
