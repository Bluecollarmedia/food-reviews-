import Link from "next/link";
import ReviewForm from "@/components/admin/ReviewForm";

export default function NewReviewPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
        &larr; Back to admin
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground">
        Add New Review
      </h1>
      <div className="mt-6">
        <ReviewForm mode="create" />
      </div>
    </div>
  );
}
