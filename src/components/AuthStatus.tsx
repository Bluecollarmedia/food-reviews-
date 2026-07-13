"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { useUnreadNotificationCount } from "@/lib/use-unread-notifications";
import { createClient } from "@/lib/supabase/client";

type Variant = "desktop" | "mobile";

function linkClassFor(variant: Variant) {
  return variant === "mobile"
    ? "block px-5 py-4 text-base font-semibold text-foreground/80 transition-colors hover:bg-surface-muted hover:text-primary"
    : "transition-colors hover:text-primary";
}

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
        Log In
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`${linkClass} ${variant === "mobile" ? "w-full text-left" : "bg-transparent"}`}
    >
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
