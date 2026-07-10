import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-lg text-white">
            D&S
          </span>
          <span className="font-display text-2xl tracking-wide text-foreground">
            D&amp;S Food Reviews
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-foreground/80">
          <Link href="/" className="transition-colors hover:text-primary">
            Reviews
          </Link>
          <Link href="/about" className="transition-colors hover:text-primary">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
