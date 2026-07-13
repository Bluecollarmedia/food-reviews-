import ProtectedBanner from "@/components/ProtectedBanner";
import AnimatedHero from "@/components/AnimatedHero";
import HomeTeaser from "@/components/HomeTeaser";
import { listPublishedReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reviews = await listPublishedReviews();

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

        {reviews.length > 0 ? (
          <HomeTeaser reviews={reviews} />
        ) : (
          <p className="mt-6 text-foreground/60">
            No reviews yet — check back soon.
          </p>
        )}
      </section>
    </div>
  );
}
