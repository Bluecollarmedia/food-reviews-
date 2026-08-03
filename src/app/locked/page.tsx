import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listLockedReviews } from "@/lib/reviews-store";
import { LOCKED_SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getLockedPasscode } from "@/lib/locked-passcode";
import ReviewsExplorer from "@/components/ReviewsExplorer";

export const dynamic = "force-dynamic";

export default async function LockedReviewsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(LOCKED_SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token, await getLockedPasscode());
  if (!valid) {
    redirect("/locked/login?redirect=/locked");
  }

  const reviews = await listLockedReviews();

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        Locked Videos
      </h1>
      <p className="mt-1 text-foreground/60">
        Reviews only visible with the passcode.
      </p>
      <div className="mt-6">
        <ReviewsExplorer reviews={reviews} />
      </div>
      {reviews.length === 0 && (
        <p className="mt-8 text-center text-foreground/60">
          No locked reviews yet.
        </p>
      )}

      <div className="mt-12 border-t border-border pt-6">
        <Link
          href="/locked/vault"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 py-4 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            <circle cx="12" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
          </svg>
          Enter the Vault
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
