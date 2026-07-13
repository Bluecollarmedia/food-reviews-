"use client";

import { useState } from "react";

export default function AdminSettingsForm({
  initialEmailNotifications,
  initialNotifyEmail,
  initialLockedPasscode,
}: {
  initialEmailNotifications: boolean;
  initialNotifyEmail: string;
  initialLockedPasscode: string;
}) {
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications);
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail);
  const [lockedPasscode, setLockedPasscode] = useState(initialLockedPasscode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailNotifications, notifyEmail, lockedPasscode }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">Locked videos passcode</p>
        <p className="mt-0.5 text-xs text-foreground/60">
          Whoever has this code can view reviews in the Locked section. Change it any time —
          anyone with the old code will need the new one.
        </p>
        <input
          value={lockedPasscode}
          onChange={(e) => setLockedPasscode(e.target.value)}
          type="text"
          placeholder="Passcode"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {saved && <p className="text-xs text-foreground/50">Saved.</p>}
    </div>
  );
}
