"use client";

import { useState } from "react";
import AppealForm from "./AppealForm";

export default function BannedActions() {
  const [showAppeal, setShowAppeal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState("");
  const [unbanned, setUnbanned] = useState(false);

  async function redeem() {
    if (!pin.trim() || pinBusy) return;
    setPinBusy(true);
    setPinError("");
    const res = await fetch("/api/appeal/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setPinBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setPinError(data?.error ?? "That code didn't work.");
      return;
    }
    setUnbanned(true);
  }

  if (unbanned) {
    return (
      <div className="mt-6 w-full max-w-sm rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-lg font-semibold text-emerald-600">You&apos;re back in ✓</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-3 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Go to the site
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full max-w-sm">
      {showAppeal ? (
        <AppealForm />
      ) : (
        <button
          onClick={() => setShowAppeal(true)}
          className="text-sm font-medium text-foreground/50 underline underline-offset-4 hover:text-primary"
        >
          Think this is a mistake? Request an appeal
        </button>
      )}

      {/* Unban code */}
      <div className="mt-6 border-t border-border pt-4">
        <p className="text-xs font-semibold text-foreground/50">Have an unban code?</p>
        <div className="mt-2 flex gap-2">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && redeem()}
            inputMode="numeric"
            placeholder="6-digit code"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm tracking-widest outline-none focus:border-primary"
          />
          <button
            onClick={redeem}
            disabled={pinBusy}
            className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
          >
            {pinBusy ? "..." : "Enter"}
          </button>
        </div>
        {pinError && <p className="mt-1 text-xs text-primary">{pinError}</p>}
      </div>
    </div>
  );
}
