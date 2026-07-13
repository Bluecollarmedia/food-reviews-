"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { useUnreadNotificationCount } from "@/lib/use-unread-notifications";
import { createClient } from "@/lib/supabase/client";

type Variant = "desktop" | "fullscreen";

function linkClassFor(variant: Variant) {
  return variant === "fullscreen"
    ? "flex items-center gap-4 py-3 font-display text-3xl tracking-wide text-foreground"
    : "transition-colors hover:text-primary";
}

const accountIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
  </svg>
);

const sessionIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
    <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Account (notifications + watch history + settings, all in one place) — only rendered once logged in. */
export function AuthLinks({
  variant = "desktop",
  onNavigate,
}: {
  variant?: Variant;
  onNavigate?: () => void;
}) {
  const { user, loading } = useSupabaseUser();
  const unreadCount = useUnreadNotificationCount(user);

  if (loading || !user) return null;

  const linkClass = linkClassFor(variant);

  return (
    <Link href="/account" onClick={onNavigate} className={linkClass}>
      {variant === "fullscreen" && <span className="text-primary">{accountIcon}</span>}
      Account{unreadCount > 0 ? ` (${unreadCount})` : ""}
    </Link>
  );
}

/** "Log In" link when logged out, or "Log Out (name)" button when logged in. */
export function AuthSessionAction({
  variant = "desktop",
  onNavigate,
}: {
  variant?: Variant;
  onNavigate?: () => void;
}) {
  const { user, displayName, loading } = useSupabaseUser();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (loading) return null;

  const linkClass = linkClassFor(variant);

  if (!user) {
    return (
      <Link href="/login" onClick={onNavigate} className={linkClass}>
        {variant === "fullscreen" && <span className="text-primary">{sessionIcon}</span>}
        Log In
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`${linkClass} ${variant === "fullscreen" ? "w-full text-left" : "bg-transparent"}`}
    >
      {variant === "fullscreen" && <span className="text-primary">{sessionIcon}</span>}
      Log Out{displayName ? ` (${displayName})` : ""}
    </button>
  );
}

export default function AuthStatus({
  variant = "desktop",
  onNavigate,
}: {
  variant?: Variant;
  onNavigate?: () => void;
}) {
  return (
    <>
      <AuthLinks variant={variant} onNavigate={onNavigate} />
      <AuthSessionAction variant={variant} onNavigate={onNavigate} />
    </>
  );
}
