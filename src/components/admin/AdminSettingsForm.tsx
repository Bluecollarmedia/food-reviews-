"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettingsForm({
  initialEmailNotifications,
  initialNotifyEmail,
  initialUnlocked,
  initialLockedPasscode,
  initialVaultPasscode,
  initialSettingsPasscode,
}: {
  initialEmailNotifications: boolean;
  initialNotifyEmail: string;
  initialUnlocked: boolean;
  initialLockedPasscode: string;
  initialVaultPasscode: string;
  initialSettingsPasscode: string;
}) {
  const router = useRouter();
  const [emailNotifications, setEmailNotifications] = useState(initialEmailNotifications);
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [unlockPasscode, setUnlockPasscode] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [lockedPasscode, setLockedPasscode] = useState(initialLockedPasscode);
  const [vaultPasscode, setVaultPasscode] = useState(initialVaultPasscode);
  const [settingsPasscode, setSettingsPasscode] = useState(initialSettingsPasscode);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    setUnlockError("");

    const res = await fetch("/api/admin/settings/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: unlockPasscode }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setUnlockError(data?.error ?? "Something went wrong.");
      setUnlocking(false);
      return;
    }

    setUnlocking(false);
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailNotifications,
        notifyEmail,
        ...(unlocked ? { lockedPasscode, vaultPasscode, settingsPasscode } : {}),
      }),
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

      {unlocked ? (
        <>
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

          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground">Vault passcode</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              A second passcode for the Vault — a folder nested inside Locked. Visitors need the
              Locked passcode first, then this one, to see Vault reviews.
            </p>
            <input
              value={vaultPasscode}
              onChange={(e) => setVaultPasscode(e.target.value)}
              type="text"
              placeholder="Passcode"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground">Security passcode</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              Required to view or change the two passcodes above. Keep this one to yourself —
              anyone with admin access can log in, but only whoever has this can touch Locked or
              Vault passcodes.
            </p>
            <input
              value={settingsPasscode}
              onChange={(e) => setSettingsPasscode(e.target.value)}
              type="text"
              placeholder="Passcode"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-foreground">Locked &amp; Vault passcodes</p>
          <p className="mt-0.5 text-xs text-foreground/60">
            Protected. Enter the security passcode to view or change them.
          </p>
          <form onSubmit={handleUnlock} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={unlockPasscode}
              onChange={(e) => setUnlockPasscode(e.target.value)}
              type="password"
              placeholder="Security passcode"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={unlocking}
              className="shrink-0 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-colors disabled:opacity-60"
            >
              {unlocking ? "Checking..." : "Unlock"}
            </button>
          </form>
          {unlockError && <p className="mt-2 text-xs text-primary">{unlockError}</p>}
        </div>
      )}

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
