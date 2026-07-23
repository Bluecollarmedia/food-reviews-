import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
    </div>
  );
}
