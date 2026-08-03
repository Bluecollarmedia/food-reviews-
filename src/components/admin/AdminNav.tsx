"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") return null;

  const links = [
    { href: "/admin", label: "Reviews" },
    { href: "/admin/visitors", label: "Visitors" },
    { href: "/admin/comments", label: "Comments" },
    { href: "/admin/users", label: "Accounts" },
    {
      href: "/admin/notifications",
      label: `Notifications${unreadNotifications ? ` (${unreadNotifications})` : ""}`,
    },
    { href: "/admin/storage", label: "Storage" },
    { href: "/admin/compress", label: "Compress Videos" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
        <span className="font-display text-lg tracking-wide text-foreground">
          D&amp;S Admin
        </span>
        <Link
          href="/"
          className="text-sm font-semibold text-foreground/60 hover:text-primary"
        >
          &larr; Back to Main Site
        </Link>
      </div>
      <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-5">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/60 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
