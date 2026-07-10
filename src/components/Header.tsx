import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/brand/logo.webp"
            alt="D&S Food Reviews"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
            priority
          />
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
