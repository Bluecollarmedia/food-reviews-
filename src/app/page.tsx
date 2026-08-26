import ProtectedBanner from "@/components/ProtectedBanner";
import HomeTeaser from "@/components/HomeTeaser";
import HomeShortsShelf from "@/components/HomeShortsShelf";
import { listPublishedReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reviews = await listPublishedReviews();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-4">
      {/* Compact branded strip — kept short and biased upward so David &
          Shmuel's faces and the logo stay in frame, instead of a tall hero
          that buries the reviews. */}
      <ProtectedBanner
        src="/images/brand/banner-desktop.webp"
        alt="D&S Food Reviews — David and Shmuel"
        className="block h-40 w-full select-none rounded-2xl object-cover object-[50%_30%] sm:h-52 lg:h-60"
      />

      {/* The pitch, calmed down to a single quiet line — the identity is still
          here, it just isn't a billboard on every visit. */}
      <p className="mt-2.5 text-center text-[13px] font-medium text-foreground/55 sm:text-sm">
        Honest. Brutal. Non-biased. — no sponsorships, no sugarcoating.
      </p>

      {/* A swipeable Shorts row, YouTube-style, right up top. */}
      {reviews.length > 0 && <HomeShortsShelf reviews={reviews} />}

      {/* Reviews are the hero now: first thing you scroll to. */}
      <section className="flex-1 pb-14 pt-6">
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
  );
}
