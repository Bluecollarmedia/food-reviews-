"use client";

import Link from "next/link";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { useUnreadNotificationCount } from "@/lib/use-unread-notifications";

const bellIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <path
      d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9.5 18a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
  </svg>
);

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Notification bell for the desktop nav row — sits inline alongside the other nav links. */
export function NotificationBellDesktop() {
  const { user } = useSupabaseUser();
  const unreadCount = useUnreadNotificationCount(user);

  if (!user) return null;

  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative flex items-center text-foreground/80 transition-colors hover:text-primary"
    >
      {bellIcon}
      <Badge count={unreadCount} />
    </Link>
  );
}

/**
 * Notification bell for mobile — fixed near the hamburger toggle so it's
 * visible immediately on any page, without opening the menu. Deliberately
 * NOT nested inside MobileNav's portal or Header's `hidden md:flex` nav,
 * since both would hide (or fail to hide) this in ways that don't match
 * `md:hidden` here — a `display: none` ancestor hides fixed children too,
 * and a portal escapes an ancestor's classes entirely.
 */
export function NotificationBellMobile() {
  const { user } = useSupabaseUser();
  const unreadCount = useUnreadNotificationCount(user);

  if (!user) return null;

  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="fixed right-[68px] top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 md:hidden"
    >
      {bellIcon}
      <Badge count={unreadCount} />
    </Link>
  );
}
