import Link from "next/link";
import { listPublishedReviews } from "@/lib/reviews-store";
import { getPublicFileUrl } from "@/lib/media-url";
import { type Review } from "@/lib/data";

export const dynamic = "force-dynamic";

function scoreText(rating: number) {
  return Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);
}

// Gold / silver / bronze for the top three of the Best list; plain muted
// numbers everywhere else (medals on the "worst" list would look wrong).
function rankStyle(index: number, medal: boolean) {
  if (!medal) return "bg-surface-muted text-foreground/50";
  if (index === 0) return "bg-amber-400 text-amber-950";
  if (index === 1) return "bg-zinc-300 text-zinc-700";
  if (index === 2) return "bg-orange-400/80 text-orange-950";
  return "bg-surface-muted text-foreground/50";
}

function RankRow({ review, index, medal }: { review: Review; index: number; medal: boolean }) {
  const thumb = getPublicFileUrl(review.thumbnailKey);
  return (
    <Link
      href={`/videos/${review.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 transition-all active:scale-[0.99] hover:border-foreground/20"
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-base leading-none ${rankStyle(
          index,
          medal
        )}`}
      >
        {index + 1}
      </span>

      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary to-accent sm:w-28">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {review.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-foreground/55">
          {review.store} &middot; {review.city}
        </p>
      </div>

      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-amber-500 font-display leading-none text-white">
        <span className="text-base">{scoreText(review.rating)}</span>
        <span className="font-sans text-[8px] font-semibold opacity-85">/10</span>
      </span>
    </Link>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tint: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <div>
        <h2 className="font-display text-2xl leading-none tracking-wide text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-foreground/50">{subtitle}</p>
      </div>
    </div>
  );
}

export default async function RankingsPage() {
  const reviews = (await listPublishedReviews()).filter(
    (r) => typeof r.rating === "number"
  );

  const best = [...reviews].sort((a, b) => b.rating - a.rating).slice(0, 10);
  const bestSlugs = new Set(best.map((r) => r.slug));
  // Lowest scores, excluding anything already shown in Best (small catalogs).
  const worst = [...reviews]
    .sort((a, b) => a.rating - b.rating)
    .filter((r) => !bestSlugs.has(r.slug))
    .slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">Rankings</h1>
      <p className="mt-1 text-foreground/55">The best — and the brutal.</p>

      {reviews.length === 0 ? (
        <p className="mt-12 text-center text-foreground/60">No rated reviews yet.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          <section>
            <SectionHeader
              tint="bg-amber-400/15 text-amber-500"
              title="Highest Rated"
              subtitle="The ones worth the drive"
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M5 3h14v2h2v3a4 4 0 0 1-4 4h-.6A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 7.6 12H7a4 4 0 0 1-4-4V5h2V3zm0 4v1a2 2 0 0 0 2 2V7H5zm14 0h-2v3a2 2 0 0 0 2-2V7z" />
                </svg>
              }
            />
            <div className="flex flex-col gap-2.5">
              {best.map((review, i) => (
                <RankRow key={review.slug} review={review} index={i} medal />
              ))}
            </div>
          </section>

          {worst.length > 0 && (
            <section>
              <SectionHeader
                tint="bg-primary/10 text-primary"
                title="Lowest Rated"
                subtitle="Skip these — they earned it"
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM8 16.5a4.5 4.5 0 0 1 8 0 .75.75 0 0 1-1.3.5 3 3 0 0 0-5.4 0 .75.75 0 0 1-1.3-.5z" />
                  </svg>
                }
              />
              <div className="flex flex-col gap-2.5">
                {worst.map((review, i) => (
                  <RankRow key={review.slug} review={review} index={i} medal={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
