import Link from "next/link";
import { notFound } from "next/navigation";
import { getReview } from "@/lib/reviews-store";
import ReviewForm from "@/components/admin/ReviewForm";

export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
        &larr; Back to admin
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground">
        Edit Review
      </h1>
      <div className="mt-6">
        <ReviewForm mode="edit" initial={review} />
      </div>
    </div>
  );
}
