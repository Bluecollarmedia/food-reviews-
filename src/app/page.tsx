import ProtectedBanner from "@/components/ProtectedBanner";
import HomeTeaser from "@/components/HomeTeaser";
import { listPublishedReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reviews = await listPublishedReviews();

  return (
    <div className="flex flex-1 flex-col">
      {/* Full-bleed, thin banner strip at the very top — edge to edge, no
          rounded corners, biased upward so faces + logo stay in frame. */}
      <ProtectedBanner
        src="/images/brand/banner-desktop.webp"
        alt="D&S Food Reviews — David and Shmuel"
        className="block h-24 w-full select-none object-cover object-[50%_32%] sm:h-32 lg:h-40"
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4">
        <section className="flex-1 pb-14 pt-5">
          <h2 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl">
            Latest Reviews
          </h2>

          {reviews.length > 0 ? (
            <HomeTeaser reviews={reviews} />
          ) : (
            <p className="mt-6 text-foreground/60">No reviews yet — check back soon.</p>
          )}
        </section>
      </div>
    </div>
  );
}
