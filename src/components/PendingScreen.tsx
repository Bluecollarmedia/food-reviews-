"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppealForm from "./AppealForm";

export default function PendingScreen({ name, denied = false }: { name: string; denied?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showAppeal, setShowAppeal] = useState(false);

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
    <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 py-12 text-center">
      <span className={`flex h-14 w-14 items-center justify-center rounded-full ${denied ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground/60"}`}>
        {denied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
            <circle cx="12" cy="12" r="9" />
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      <h1 className="mt-4 font-display text-2xl tracking-wide text-foreground">
        {denied
          ? `Your account isn't active${name ? `, ${name}` : ""}`
          : `Hang tight${name ? `, ${name}` : ""} — your account is pending`}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-foreground/60">
        {denied
          ? "The owner hasn't granted this account access. If you think that's a mistake, you can send an appeal below and the owner will take another look."
          : "This is a members-only site. The owner has to approve new accounts before you can come in. You'll be able to log in and watch once you're approved."}
      </p>

      {denied &&
        (showAppeal ? (
          <div className="mt-6 w-full max-w-sm">
            <AppealForm />
          </div>
        ) : (
          <button
            onClick={() => setShowAppeal(true)}
            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Request an appeal
          </button>
        ))}

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
