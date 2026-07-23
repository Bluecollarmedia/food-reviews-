"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/shorts")) return null;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-8 text-center text-sm text-foreground/60">
        <p className="font-display text-lg tracking-wide text-foreground">
          D&amp;S Food Reviews
        </p>
        <p className="mt-1">Honest, brutal, non-biased reviews on food.</p>
        <p className="mt-4">&copy; {new Date().getFullYear()} D&amp;S Food Reviews. All rights reserved.</p>
      </div>
    </footer>
  );
}
