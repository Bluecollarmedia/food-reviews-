export default function RatingStars({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];
  const stars = [0, 1, 2, 3, 4];

  return (
    <div className={`flex items-center gap-1 ${sizeClass}`}>
      <div className="flex">
        {stars.map((i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <span key={i} className="relative inline-block leading-none text-border">
              <span aria-hidden>★</span>
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden text-accent"
                  style={{ width: `${fill * 100}%` }}
                  aria-hidden
                >
                  ★
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="font-semibold text-foreground/80">{rating.toFixed(1)}</span>
    </div>
  );
}
