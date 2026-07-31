import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listVaultReviews } from "@/lib/reviews-store";
import { LOCKED_SESSION_COOKIE, VAULT_SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getLockedPasscode, getVaultPasscode } from "@/lib/locked-passcode";
import ReviewsExplorer from "@/components/ReviewsExplorer";

export const dynamic = "force-dynamic";

export default async function VaultReviewsPage() {
  const cookieStore = await cookies();

  // Must be past the regular Locked gate first…
  const lockedToken = cookieStore.get(LOCKED_SESSION_COOKIE)?.value;
  const hasLockedAccess = await verifySessionToken(lockedToken, await getLockedPasscode());
  if (!hasLockedAccess) {
    redirect("/locked/login?redirect=/locked/vault");
  }

  // …then past the Vault gate.
  const vaultToken = cookieStore.get(VAULT_SESSION_COOKIE)?.value;
  const hasVaultAccess = await verifySessionToken(vaultToken, await getVaultPasscode());
  if (!hasVaultAccess) {
    redirect("/locked/vault/login?redirect=/locked/vault");
  }

  const reviews = await listVaultReviews();

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
      <Link href="/locked" className="text-sm font-medium text-primary hover:underline">
        &larr; Back to Locked
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        The Vault
      </h1>
      <p className="mt-1 text-foreground/60">
        Reviews behind the second passcode.
      </p>
      <div className="mt-6">
        <ReviewsExplorer reviews={reviews} />
      </div>
      {reviews.length === 0 && (
        <p className="mt-8 text-center text-foreground/60">No vault reviews yet.</p>
      )}
    </div>
  );
}
