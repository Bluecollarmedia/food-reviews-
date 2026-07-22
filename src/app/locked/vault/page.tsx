import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listVaultReviews } from "@/lib/reviews-store";
import { LOCKED_SESSION_COOKIE, VAULT_SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getLockedPasscode, getVaultPasscode } from "@/lib/locked-passcode";
import ReviewsExplorer from "@/components/ReviewsExplorer";

export const dynamic = "force-dynamic";

export default async function VaultReviewsPage() {
  const cookieStore = await cookies();

  const lockedToken = cookieStore.get(LOCKED_SESSION_COOKIE)?.value;
  const hasLockedAccess = await verifySessionToken(lockedToken, await getLockedPasscode());
  if (!hasLockedAccess) {
    redirect("/locked/login?redirect=/locked/vault");
  }

  const vaultToken = cookieStore.get(VAULT_SESSION_COOKIE)?.value;
  const hasVaultAccess = await verifySessionToken(vaultToken, await getVaultPasscode());
  if (!hasVaultAccess) {
    redirect("/locked/vault/login?redirect=/locked/vault");
  }

  const reviews = await listVaultReviews();

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        Vault
      </h1>
      <p className="mt-1 text-foreground/60">
        Reviews only visible with the vault passcode.
      </p>
      <div className="mt-6">
        <ReviewsExplorer reviews={reviews} />
      </div>
      {reviews.length === 0 && (
        <p className="mt-8 text-center text-foreground/60">
          No vault reviews yet.
        </p>
      )}
    </div>
  );
}
