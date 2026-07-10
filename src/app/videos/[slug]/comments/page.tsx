import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedReview } from "@/lib/reviews-store";
import AllCommentsClient from "@/components/AllCommentsClient";

export const dynamic = "force-dynamic";

export default async function AllCommentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getPublishedReview(slug);
  if (!review) notFound();

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
