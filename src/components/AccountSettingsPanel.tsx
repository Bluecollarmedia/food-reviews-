"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/use-supabase-user";
import { uploadAvatar } from "@/lib/upload-avatar";
import { resizeImageToSquare } from "@/lib/resize-image";
import { getPublicFileUrl } from "@/lib/media-url";

export default function AccountSettingsPanel() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login?redirect=/account?tab=settings");
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("email_notifications, avatar_key")
      .eq("id", user.id)
      .single()
      .then(
        ({
          data,
        }: {
          data: { email_notifications: boolean; avatar_key: string | null } | null;
        }) => {
          setEmailNotifications(data?.email_notifications ?? false);
          setAvatarUrl(getPublicFileUrl(data?.avatar_key));
          setReady(true);
        }
      );
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

  async function handleAvatarPicked(file: File | undefined) {
    if (!file || !user) return;
    setUploadingAvatar(true);
    setAvatarUrl(URL.createObjectURL(file));

    try {
      const resized = await resizeImageToSquare(file);
      const avatarKey = await uploadAvatar(resized);
      const supabase = createClient();
      await supabase.from("profiles").update({ avatar_key: avatarKey }).eq("id", user.id);
      setAvatarUrl(getPublicFileUrl(avatarKey));
    } catch {
      // keep the local preview even if the save failed silently
    }
    setUploadingAvatar(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");

    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      setDeleteError("Couldn't delete your account. Try again in a moment.");
      setDeleting(false);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading || !ready) return null;

  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-background text-foreground/40 hover:border-primary hover:text-primary">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path d="M12 16V4m0 0L7 9m5-5l5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAvatarPicked(e.target.files?.[0])}
          />
        </label>
        <p className="text-xs text-foreground/50">
          {uploadingAvatar ? "Uploading..." : "Tap to change your profile picture."}
        </p>
      </div>

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

      <div className="mt-10 border-t border-border pt-6">
        <p className="text-sm font-semibold text-foreground">Delete account</p>
        <p className="mt-0.5 text-xs text-foreground/60">
          This permanently deletes your login and profile. Your past comments stay up, shown as
          &quot;Deleted user.&quot;
        </p>

        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="mt-3 rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">
              Are you sure? This can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, delete it"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground/70 hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {deleteError && <p className="mt-2 text-xs text-primary">{deleteError}</p>}
      </div>
    </div>
  );
}
