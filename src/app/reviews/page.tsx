import ReviewsExplorer from "@/components/ReviewsExplorer";
import { listPublishedReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await listPublishedReviews();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        All Reviews
      </h1>
      <p className="mt-1 text-foreground/60">
        Search, filter by category, or browse by reviewer.
      </p>
      <div className="mt-6">
        <ReviewsExplorer reviews={reviews} />
      </div>
    </div>
  );
}
