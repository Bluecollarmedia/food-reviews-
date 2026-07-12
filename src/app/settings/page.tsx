"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/use-supabase-user";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login?redirect=/settings");
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("email_notifications")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { email_notifications: boolean } | null }) => {
        setEmailNotifications(data?.email_notifications ?? false);
        setReady(true);
      });
  }, [loading, user, router]);

  async function handleToggle() {
    if (!user) return;
    const next = !emailNotifications;
    setEmailNotifications(next);
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    await supabase.from("profiles").update({ email_notifications: next }).eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !ready) return null;

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground">Settings</h1>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Email notifications</p>
          <p className="mt-0.5 text-xs text-foreground/60">
            Also get an email when someone replies to your comment.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          aria-pressed={emailNotifications}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            emailNotifications ? "bg-primary" : "bg-foreground/20"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              emailNotifications ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {saved && <p className="mt-2 text-xs text-foreground/50">Saved.</p>}
    </div>
  );
}
