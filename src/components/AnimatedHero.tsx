"use client";

import { useEffect, useState } from "react";

export default function AnimatedHero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="mt-8 px-5 py-10 text-center">
      <h1
        className={`font-display text-3xl tracking-wide text-foreground transition-all duration-700 ease-out sm:text-4xl ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        Honest. Brutal. Non-Biased.
      </h1>
      <p
        className={`mx-auto mt-3 max-w-xl text-foreground/70 transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
        style={{ transitionDelay: visible ? "150ms" : "0ms" }}
      >
        David &amp; Shmuel taste it, argue about it, and tell you exactly what
        to skip and what&apos;s worth the drive &mdash; no sponsorships, no
        sugarcoating.
      </p>
    </section>
  );
}
