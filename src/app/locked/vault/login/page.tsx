"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VaultLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/locked/vault/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    router.push(searchParams.get("redirect") || "/locked/vault");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-5 py-24">
      <h1 className="mb-2 text-center font-display text-3xl tracking-wide text-foreground">
        Vault
      </h1>
      <p className="mb-6 text-center text-sm text-foreground/60">
        Enter the vault passcode to view these reviews.
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

export default function VaultLoginPage() {
  return (
    <Suspense>
      <VaultLoginForm />
    </Suspense>
  );
}
