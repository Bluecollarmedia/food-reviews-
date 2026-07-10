import Link from "next/link";
import { listAllReviews } from "@/lib/reviews-store";
import AdminReviewCard from "@/components/admin/AdminReviewCard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const reviews = await listAllReviews();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
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

      <div className="mt-8 flex flex-col gap-4">
        {reviews.map((r) => (
          <AdminReviewCard key={r.slug} review={r} />
        ))}

        {reviews.length === 0 && (
          <p className="mt-8 text-center text-foreground/60">
            No reviews yet — tap "Add New Review" to create the first one.
          </p>
        )}
      </div>
    </div>
  );
}
