"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendingScreen({ name }: { name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await createClient().auth.signOut();
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5 text-foreground/60">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1 className="mt-4 font-display text-2xl tracking-wide text-foreground">
        Hang tight{name ? `, ${name}` : ""} — your account is pending
      </h1>
      <p className="mt-2 max-w-sm text-sm text-foreground/60">
        This is a members-only site. The owner has to approve new accounts before you
        can come in. You&apos;ll be able to log in and watch once you&apos;re approved.
      </p>
      <button
        onClick={logout}
        disabled={busy}
        className="mt-6 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground/70 hover:border-primary hover:text-primary disabled:opacity-60"
      >
        {busy ? "..." : "Log out"}
      </button>
    </div>
  );
}
