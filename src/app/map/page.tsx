import Link from "next/link";
import { listPublishedReviews } from "@/lib/reviews-store";
import { getPublicFileUrl } from "@/lib/media-url";
import MapExplorer, { type MapSpot } from "@/components/MapExplorer";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const reviews = await listPublishedReviews();
  const spots: MapSpot[] = reviews
    .filter((r) => typeof r.lat === "number" && typeof r.lng === "number")
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      store: r.store,
      city: r.city,
      rating: r.rating,
      lat: r.lat as number,
      lng: r.lng as number,
      thumbnailUrl: getPublicFileUrl(r.thumbnailKey),
    }));

  return (
    <div className="fixed inset-x-0 top-[var(--header-h,64px)] bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-0 overflow-hidden md:bottom-0">
      <MapExplorer spots={spots} />

      {/* Big, obvious way out — a red Back pill, top-left. */}
      <Link
        href="/"
        aria-label="Back to home"
        className="absolute left-3 top-3 z-[600] flex items-center gap-1.5 rounded-full bg-primary py-2.5 pl-3 pr-4 text-sm font-bold text-white shadow-lg shadow-black/25 transition-transform active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </Link>

      {/* Floating title / count chip. */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2">
        <div className="rounded-full bg-surface/95 px-4 py-1.5 text-sm font-bold text-foreground shadow-md backdrop-blur">
          <span className="font-display tracking-wide">The Map</span>
          <span className="ml-2 text-foreground/50">
            {spots.length} {spots.length === 1 ? "spot" : "spots"}
          </span>
        </div>
      </div>

      {spots.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[500] flex justify-center px-6">
          <p className="pointer-events-auto rounded-2xl bg-surface/95 px-5 py-3 text-center text-sm text-foreground/70 shadow-md backdrop-blur">
            No spots on the map yet — add a location to a review in the admin panel and it&apos;ll appear here.
          </p>
        </div>
      )}
    </div>
  );
}
