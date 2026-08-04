import { listVisitors, getHiddenVisitors } from "@/lib/visitors";
import { getBans } from "@/lib/bans";
import { listAllReviews } from "@/lib/reviews-store";
import AdminVisitors from "@/components/admin/AdminVisitors";

export const dynamic = "force-dynamic";

export default async function AdminVisitorsPage() {
  const [visitors, hidden, bans, reviews] = await Promise.all([
    listVisitors(),
    getHiddenVisitors(),
    getBans(),
    listAllReviews(),
  ]);

  // slug -> title, so a visit to /videos/<slug> can show the real video name.
  const titles: Record<string, string> = {};
  for (const r of reviews) titles[r.slug] = r.title;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground">
        Admin &middot; Visitors
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Grouped by device, so one phone is one visitor even when its IP keeps
        changing. Name a device so you know who it is, or hide one (like your own).
      </p>

      <AdminVisitors
        visitors={visitors}
        hidden={hidden}
        bannedIps={bans.ips}
        banMessage={bans.message}
        titles={titles}
      />
    </div>
  );
}
