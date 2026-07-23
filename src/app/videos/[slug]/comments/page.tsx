import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getReview } from "@/lib/reviews-store";
import { LOCKED_SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { getLockedPasscode } from "@/lib/locked-passcode";
import AllCommentsClient from "@/components/AllCommentsClient";

export const dynamic = "force-dynamic";

export default async function AllCommentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review || review.status === "draft") notFound();

  if (review.status === "locked") {
    const cookieStore = await cookies();
    const token = cookieStore.get(LOCKED_SESSION_COOKIE)?.value;
    const valid = await verifySessionToken(token, await getLockedPasscode());
    if (!valid) redirect(`/locked/login?redirect=/videos/${slug}/comments`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link
        href={`/videos/${slug}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        &larr; Back to {review.title}
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground">
        Comments
      </h1>
      <div className="mt-6">
        <AllCommentsClient slug={slug} />
      </div>
    </div>
  );
}
