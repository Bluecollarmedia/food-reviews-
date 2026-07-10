"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LockedLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setDebugInfo(null);

    const res = await fetch("/api/locked/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      if (data?.debug) setDebugInfo(JSON.stringify(data.debug, null, 2));
      setSubmitting(false);
      return;
    }

    router.push(searchParams.get("redirect") || "/locked");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-5 py-24">
      <h1 className="mb-2 text-center font-display text-3xl tracking-wide text-foreground">
        Locked Videos
      </h1>
      <p className="mb-6 text-center text-sm text-foreground/60">
        Enter the passcode to view these reviews.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          type="password"
          placeholder="Passcode"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        {debugInfo && (
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-primary bg-black p-3 text-xs text-emerald-400">
            {debugInfo}
          </pre>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Checking..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}

export default function LockedLoginPage() {
  return (
    <Suspense>
      <LockedLoginForm />
    </Suspense>
  );
}
