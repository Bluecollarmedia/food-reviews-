import Image from "next/image";
import CategoryFilterGrid from "@/components/CategoryFilterGrid";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-accent px-5 py-20 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <Image src="/images/reviewers/d.jpeg" alt="D" fill className="object-cover" priority />
            </div>
            <div className="relative -ml-5 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <Image src="/images/reviewers/s.jpeg" alt="S" fill className="object-cover" priority />
            </div>
          </div>
          <h1 className="font-display text-5xl leading-tight tracking-wide sm:text-6xl">
            Honest. Brutal. Non-Biased.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
            D &amp; S taste it, argue about it, and tell you exactly what to
            skip and what's worth the drive. We do honest, brutal reviews on
            food &mdash; no sponsorships, no sugarcoating.
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
          <CategoryFilterGrid />
        </div>
      </section>
    </div>
  );
}
