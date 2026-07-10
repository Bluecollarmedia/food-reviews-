import Link from "next/link";
import { listAllReviews } from "@/lib/reviews-store";
import AdminReviewRow from "@/components/admin/AdminReviewRow";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const reviews = await listAllReviews();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-wide text-foreground">
          Admin &middot; Reviews
        </h1>
        <Link
          href="/admin/new"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          + Add New Review
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-foreground/50">
              <th className="pb-2 pr-4">Review</th>
              <th className="pb-2 pr-4">Categories</th>
              <th className="pb-2 pr-4">Rating</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Video</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <AdminReviewRow key={r.slug} review={r} />
            ))}
          </tbody>
        </table>

        {reviews.length === 0 && (
          <p className="mt-8 text-center text-foreground/60">
            No reviews yet — click "Add New Review" to create the first one.
          </p>
        )}
      </div>
    </div>
  );
}
