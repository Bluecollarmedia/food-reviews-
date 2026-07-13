"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    setMounted(true);
  }, []);

  function handleToggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Dark mode</p>
        <p className="mt-0.5 text-xs text-foreground/60">
          Switch the site to a dark color scheme.
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isDark}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          isDark ? "bg-primary" : "bg-foreground/20"
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${
            isDark ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
