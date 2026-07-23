import { listPublishedReviews } from "@/lib/reviews-store";
import ShortsFeed from "@/components/ShortsFeed";

export const dynamic = "force-dynamic";

export default async function ShortsPage() {
  const reviews = (await listPublishedReviews()).filter((r) => r.videoKey);

  if (reviews.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 text-center text-foreground/60">
        No videos yet.
      </div>
    );
  }

  return <ShortsFeed reviews={reviews} />;
}
