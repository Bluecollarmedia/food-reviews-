"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SiteLockForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/site-lock/login", {
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

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm outline-none focus:border-primary"
      />
      {error && <p className="text-sm text-primary">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {submitting ? "Checking..." : "Enter"}
      </button>
    </form>
  );
}
