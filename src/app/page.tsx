import Link from "next/link";
import VideoCard from "@/components/VideoCard";
import ProtectedBanner from "@/components/ProtectedBanner";
import AnimatedHero from "@/components/AnimatedHero";
import { listPublishedReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

const TEASER_COUNT = 2;

export default async function Home() {
  const reviews = await listPublishedReviews();
  const teaser = reviews.slice(0, TEASER_COUNT);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-6xl px-5 pt-6">
        <ProtectedBanner src="/images/brand/banner-desktop.webp" alt="D&S Food Reviews — David and Shmuel" />
      </div>

      <AnimatedHero />

      <section className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <h2 className="font-display text-3xl tracking-wide text-foreground">
          Latest Reviews
        </h2>
        <p className="mt-1 text-foreground/60">
          Videos are on the way — here's a preview of what's coming.
        </p>

        {teaser.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {teaser.map((review) => (
              <VideoCard key={review.slug} review={review} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-foreground/60">
            No reviews yet — check back soon.
          </p>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            View All Reviews
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
