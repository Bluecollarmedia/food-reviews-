"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-error";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const redirect = searchParams.get("redirect") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(authErrorMessage(error.message));
      setSubmitting(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setResetSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(authErrorMessage(error.message));
      setResetSubmitting(false);
      return;
    }

    setResetSent(true);
    setResetSubmitting(false);
  }

  if (showReset) {
    if (resetSent) {
      return (
        <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-5 py-24 text-center">
          <h1 className="mb-3 font-display text-3xl tracking-wide text-foreground">
            Check Your Email
          </h1>
          <p className="text-sm text-foreground/70">
            If an account exists for <span className="font-semibold">{email}</span>, a password
            reset link is on its way.
          </p>
          <Link
            href="/login"
            className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Back to Log In
          </Link>
        </div>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-5 py-24">
        <h1 className="mb-6 text-center font-display text-3xl tracking-wide text-foreground">
          Reset Password
        </h1>
        <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-primary">{error}</p>}
          <button
            type="submit"
            disabled={resetSubmitting}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {resetSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setShowReset(false)}
          className="mt-4 text-center text-sm font-semibold text-foreground/60 hover:text-foreground"
        >
          Back to Log In
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-5 py-24">
      <h1 className="mb-6 text-center font-display text-3xl tracking-wide text-foreground">
        Log In
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="Password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-primary">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setShowReset(true)}
        className="mt-3 text-center text-sm font-semibold text-foreground/60 hover:text-foreground"
      >
        Forgot password?
      </button>

      <p className="mt-4 text-center text-sm text-foreground/60">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Sign up
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
