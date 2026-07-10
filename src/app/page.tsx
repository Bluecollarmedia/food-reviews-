import ReviewsExplorer from "@/components/ReviewsExplorer";
import { listPublishedReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reviews = await listPublishedReviews();

  return (
    <div className="flex flex-1 flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand/banner-desktop.webp"
        alt="D&S Food Reviews — David and Shmuel"
        className="block h-auto w-full"
      />

      <section className="border-b border-border bg-surface px-5 py-10 text-center">
        <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
          Honest. Brutal. Non-Biased.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-foreground/70">
          David &amp; Shmuel taste it, argue about it, and tell you exactly
          what to skip and what's worth the drive &mdash; no sponsorships,
          no sugarcoating.
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <h2 className="font-display text-3xl tracking-wide text-foreground">
          Latest Reviews
        </h2>
        <p className="mt-1 text-foreground/60">
          Videos are on the way — here's a preview of what's coming.
        </p>
        <div className="mt-6">
          <ReviewsExplorer reviews={reviews} />
        </div>
      </section>
    </div>
  );
}
