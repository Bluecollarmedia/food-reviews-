"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/upload-avatar";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const redirect = searchParams.get("redirect") || "/";

  function handleAvatarPicked(file: File | undefined) {
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() } },
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    if (data.session && data.user) {
      if (avatarFile) {
        try {
          const avatarKey = await uploadAvatar(avatarFile);
          await supabase.from("profiles").update({ avatar_key: avatarKey }).eq("id", data.user.id);
        } catch {
          // non-critical, they can add a picture later in Settings
        }
      }
      router.push(redirect);
      router.refresh();
      return;
    }

    setCheckEmail(true);
    setSubmitting(false);
  }

  if (checkEmail) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-5 py-24 text-center">
        <h1 className="mb-3 font-display text-3xl tracking-wide text-foreground">
          Check Your Email
        </h1>
        <p className="text-sm text-foreground/70">
          We sent a confirmation link to <span className="font-semibold">{email}</span>. Tap it,
          then come back and log in.
        </p>
        {avatarFile && (
          <p className="mt-2 text-xs text-foreground/50">
            You can add your profile picture once you&apos;re logged in, under Settings.
          </p>
        )}
        <Link
          href="/login"
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Go to Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-5 py-24">
      <h1 className="mb-6 text-center font-display text-3xl tracking-wide text-foreground">
        Sign Up
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-background text-foreground/40 hover:border-primary hover:text-primary">
            {avatarPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreviewUrl} alt="Profile preview" className="h-full w-full object-cover" />
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
            Profile picture (optional) — shown next to your comments.
          </p>
        </div>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password (at least 6 characters)"
          autoComplete="new-password"
          minLength={6}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-foreground/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>

      <Link
        href={redirect}
        className="mt-2 text-center text-sm font-semibold text-foreground/60 hover:text-foreground"
      >
        Continue as Guest
      </Link>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
