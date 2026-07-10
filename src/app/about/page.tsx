import Image from "next/image";

const reviewers = [
  {
    initial: "D",
    name: "David",
    photo: "/images/reviewers/d.jpeg",
    bio: "The heat-seeker. If it's not spicy, crispy, or dripping in sauce, David isn't interested — and won't pretend otherwise.",
  },
  {
    initial: "S",
    name: "Shmuel",
    photo: "/images/reviewers/s.jpeg",
    bio: "The skeptic. Shmuel calls out overpriced portions and soggy crusts on sight. Hardest score to earn a 5 from.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14">
      <h1 className="font-display text-4xl tracking-wide text-foreground">
        About D&amp;S Food Reviews
      </h1>
      <p className="mt-3 max-w-2xl text-foreground/80 leading-relaxed">
        We're two friends who eat our way through this city's food scene and
        tell you exactly what we think — no sponsorships dictating the score,
        no sugarcoating. Honest, brutal, non-biased reviews on food.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {reviewers.map((r) => (
          <div
            key={r.initial}
            className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm"
          >
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-accent-light shadow-md">
              <Image src={r.photo} alt={r.name} fill className="object-cover" />
            </div>
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              {r.name}
            </h2>
            <p className="text-sm text-foreground/70">{r.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
