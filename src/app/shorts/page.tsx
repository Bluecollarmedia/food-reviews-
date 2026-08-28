import { listPublishedReviews } from "@/lib/reviews-store";
import ShortsFeed from "@/components/ShortsFeed";
import type { Review } from "@/lib/data";

export const dynamic = "force-dynamic";

function shuffle(items: Review[]): Review[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function ShortsPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const withVideo = (await listPublishedReviews()).filter((r) => r.videoKey);
  const reviews = shuffle(withVideo);

  // If opened from a specific thumbnail (?v=slug), start the feed on that video
  // instead of a random one.
  if (v) {
    const idx = reviews.findIndex((r) => r.slug === v);
    if (idx > 0) {
      const [picked] = reviews.splice(idx, 1);
      reviews.unshift(picked);
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 text-center text-foreground/60">
        No videos yet.
      </div>
    );
  }

  return <ShortsFeed reviews={reviews} />;
}
