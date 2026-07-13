export default function ScoreBadge({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const dims = {
    xs: { badge: "h-7 w-7 text-[10px]", sub: "text-[6px]" },
    sm: { badge: "h-10 w-10 text-sm", sub: "text-[9px]" },
    md: { badge: "h-12 w-12 text-base", sub: "text-[10px]" },
    lg: { badge: "h-16 w-16 text-xl", sub: "text-xs" },
  }[size];

  const display = Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-full bg-amber-500 font-display leading-none text-white shadow-sm ${dims.badge}`}
    >
      <span>{display}</span>
      <span className={`${dims.sub} font-sans font-semibold opacity-80`}>/10</span>
    </div>
  );
}
