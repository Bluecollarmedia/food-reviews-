"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { useUnreadNotificationCount } from "@/lib/use-unread-notifications";
import { createClient } from "@/lib/supabase/client";

export default function AuthStatus({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const { user, displayName, loading } = useSupabaseUser();
  const unreadCount = useUnreadNotificationCount(user);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (loading) return null;

  const linkClass =
    variant === "mobile"
      ? "block px-5 py-4 text-base font-bold text-primary transition-colors hover:bg-primary/10"
      : "transition-colors hover:text-primary";

  if (!user) {
    return (
      <Link href="/login" onClick={onNavigate} className={linkClass}>
        Log In
      </Link>
    );
  }

  return (
    <>
      <Link href="/notifications" onClick={onNavigate} className={linkClass}>
        Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
      </Link>
      <Link href="/history" onClick={onNavigate} className={linkClass}>
        Watch History
      </Link>
      <Link href="/settings" onClick={onNavigate} className={linkClass}>
        Settings
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className={`${linkClass} ${variant === "mobile" ? "w-full text-left" : "bg-transparent"}`}
      >
        Log Out{displayName ? ` (${displayName})` : ""}
      </button>
    </>
  );
}
