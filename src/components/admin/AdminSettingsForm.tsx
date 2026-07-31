"use client";

import { useState } from "react";

type BannerDuration = "none" | "24h" | "1w";
type SiteLockMode = "off" | "full" | "code";

export default function AdminSettingsForm({
  initialEmailNotifications,
  initialNotifyEmail,
  initialLockedPasscode,
  initialVaultPasscode,
  initialBannerMessage,
  initialBannerExpiresAt,
  initialSiteLockMode,
  initialSiteLockPasscode,
}: {
  initialEmailNotifications: boolean;
  initialNotifyEmail: string;
  initialLockedPasscode: string;
  initialVaultPasscode: string;
  initialBannerMessage: string;
  initialBannerExpiresAt: string | null;
  initialSiteLockMode: SiteLockMode;
  initialSiteLockPasscode: string;
}) {
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications);
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail);
  const [lockedPasscode, setLockedPasscode] = useState(initialLockedPasscode);
  const [vaultPasscode, setVaultPasscode] = useState(initialVaultPasscode);

  const [bannerMessage, setBannerMessage] = useState(initialBannerMessage);
  const [bannerDuration, setBannerDuration] = useState<BannerDuration>("none");

  const [siteLockMode, setSiteLockMode] = useState<SiteLockMode>(initialSiteLockMode);
  const [siteLockPasscode, setSiteLockPasscode] = useState(initialSiteLockPasscode);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const existingExpiry =
    initialBannerExpiresAt && new Date(initialBannerExpiresAt).getTime() > Date.now()
      ? new Date(initialBannerExpiresAt)
      : null;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailNotifications,
        notifyEmail,
        lockedPasscode,
        vaultPasscode,
        bannerMessage,
        bannerDuration,
        siteLockMode,
        siteLockPasscode,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't save. Try again.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const durationOptions: { value: BannerDuration; label: string }[] = [
    { value: "none", label: "Until I remove it" },
    { value: "24h", label: "24 hours" },
    { value: "1w", label: "1 week" },
  ];

  const lockOptions: { value: SiteLockMode; label: string; hint: string }[] = [
    { value: "off", label: "Off", hint: "Site open to everyone (normal)." },
    { value: "full", label: "Full lockdown", hint: "Whole site closed — visitors see a friendly “we’ll be right back” screen." },
    { value: "code", label: "Locked with a code", hint: "Visitors need a passcode to get in." },
  ];

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Email notifications</p>
          <p className="mt-0.5 text-xs text-foreground/60">
            Also get an email every time someone comments or replies.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEmailNotifications((v) => !v)}
          aria-pressed={emailNotifications}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            emailNotifications ? "bg-primary" : "bg-foreground/20"
          }`}
        >
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              emailNotifications ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {emailNotifications && (
        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">
            Notify this email address
          </label>
          <input
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      )}

      {/* All the video passcodes in one place */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">Passcodes</p>
        <p className="mt-0.5 text-xs text-foreground/60">
          The two codes that unlock your hidden videos. Change either any time — anyone with an old
          code will need the new one.
        </p>

        <label className="mt-4 block text-xs font-semibold text-foreground">Locked passcode</label>
        <p className="mt-0.5 text-xs text-foreground/50">
          Opens the regular Locked section.
        </p>
        <input
          value={lockedPasscode}
          onChange={(e) => setLockedPasscode(e.target.value)}
          type="text"
          placeholder="Locked passcode"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <label className="mt-4 block text-xs font-semibold text-foreground">Vault passcode</label>
        <p className="mt-0.5 text-xs text-foreground/50">
          The second, deeper code — for videos inside the Vault. Visitors need the Locked passcode
          first, then this one.
        </p>
        <input
          value={vaultPasscode}
          onChange={(e) => setVaultPasscode(e.target.value)}
          type="text"
          placeholder="Vault passcode"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Announcement screen */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">Announcement screen</p>
        <p className="mt-0.5 text-xs text-foreground/60">
          Whatever you write here shows as a full branded welcome screen — logo and all — the
          first time someone opens the site. They tap “Continue” to go in. Leave it empty to take
          it down.
        </p>
        <textarea
          value={bannerMessage}
          onChange={(e) => setBannerMessage(e.target.value)}
          rows={4}
          maxLength={600}
          placeholder="e.g. Emergency meeting tonight at 8pm about the scoreboard. New videos are paused until Sunday — thanks for bearing with us!"
          className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {bannerMessage.trim() && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold text-foreground/70">Take it down automatically after:</p>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBannerDuration(opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    bannerDuration === opt.value
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-foreground/70"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {existingExpiry && (
              <p className="mt-2 text-xs text-foreground/50">
                Currently set to disappear on {existingExpiry.toLocaleString()}. Pick an option
                above and save to change it.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Site lockdown */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">Lock the whole site</p>
        <p className="mt-0.5 text-xs text-foreground/60">
          Closes the entire public site in one switch. You&apos;re never locked out — the admin
          panel always stays open so you can turn it back off.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {lockOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSiteLockMode(opt.value)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                siteLockMode === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  siteLockMode === opt.value ? "border-primary" : "border-foreground/30"
                }`}
              >
                {siteLockMode === opt.value && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                <span className="block text-xs text-foreground/60">{opt.hint}</span>
              </span>
            </button>
          ))}
        </div>
        {siteLockMode === "code" && (
          <input
            value={siteLockPasscode}
            onChange={(e) => setSiteLockPasscode(e.target.value)}
            type="text"
            placeholder="Passcode visitors must enter"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {error && <p className="text-xs text-primary">{error}</p>}
      {saved && <p className="text-xs text-foreground/50">Saved.</p>}
    </div>
  );
}
