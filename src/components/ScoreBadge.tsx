function scoreColor(score: number) {
  if (score >= 8) return "bg-emerald-600";
  if (score >= 6) return "bg-accent";
  return "bg-primary";
}

export default function ScoreBadge({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: { badge: "h-10 w-10 text-sm", sub: "text-[9px]" },
    md: { badge: "h-12 w-12 text-base", sub: "text-[10px]" },
    lg: { badge: "h-16 w-16 text-xl", sub: "text-xs" },
  }[size];

  const display = Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-full font-display leading-none text-white shadow-sm ${dims.badge} ${scoreColor(rating)}`}
    >
      <span>{display}</span>
      <span className={`${dims.sub} font-sans font-semibold opacity-80`}>/10</span>
    </div>
  );
}
