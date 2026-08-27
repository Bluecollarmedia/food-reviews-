// Embedded Google Street View of the store, via the (free) Maps Embed API.
// Renders nothing unless the review has a location and the public embed key is
// configured, so the page is unaffected until both exist.
export default function StreetViewEmbed({
  lat,
  lng,
  label,
}: {
  lat?: number;
  lng?: number;
  label?: string;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  if (!key || typeof lat !== "number" || typeof lng !== "number") return null;

  const src = `https://www.google.com/maps/embed/v1/streetview?key=${key}&location=${lat},${lng}&heading=0&pitch=0&fov=80`;

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h2 className="font-display text-2xl tracking-wide text-foreground">Street View</h2>
      <p className="mt-1 text-sm text-foreground/55">
        Take a look around {label ? label : "the spot"}.
      </p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border shadow-sm">
        <iframe
          title="Street View"
          src={src}
          loading="lazy"
          allowFullScreen
          className="h-64 w-full sm:h-80"
        />
      </div>
    </div>
  );
}
