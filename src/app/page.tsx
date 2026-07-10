import Image from "next/image";
import ReviewsExplorer from "@/components/ReviewsExplorer";
import { listPublishedReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reviews = await listPublishedReviews();

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-accent px-5 py-20 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-center">
            <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-lg sm:h-44 sm:w-44">
              <Image src="/images/reviewers/d.jpeg" alt="David" fill className="object-cover" priority />
            </div>
            <div className="relative -ml-8 h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-lg sm:h-44 sm:w-44">
              <Image src="/images/reviewers/s.jpeg" alt="Shmuel" fill className="object-cover" priority />
            </div>
          </div>
          <h1 className="font-display text-5xl leading-tight tracking-wide sm:text-6xl">
            Honest. Brutal. Non-Biased.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
            David &amp; Shmuel taste it, argue about it, and tell you exactly
            what to skip and what's worth the drive. We do honest, brutal
            reviews on food &mdash; no sponsorships, no sugarcoating.
          </p>
        </div>
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
