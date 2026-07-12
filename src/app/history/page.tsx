import { redirect } from "next/navigation";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getReview } from "@/lib/reviews-store";
import VideoCard from "@/components/VideoCard";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/history");
  }

  const { data: rows } = await supabase
    .from("watch_history")
    .select("slug, watched_at, progress_seconds, duration_seconds")
    .eq("user_id", user.id)
    .order("watched_at", { ascending: false });

  const progressBySlug = new Map(
    (rows ?? []).map((row) => [
      row.slug,
      row.duration_seconds > 0 ? (row.progress_seconds / row.duration_seconds) * 100 : 0,
    ])
  );

  const reviews = (
    await Promise.all((rows ?? []).map(async (row) => getReview(row.slug)))
  ).filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
        Watch History
      </h1>
      <p className="mt-1 text-foreground/60">Videos you&apos;ve watched, most recent first.</p>

      {reviews.length === 0 ? (
        <p className="mt-12 text-center text-foreground/60">
          You haven&apos;t watched any reviews yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <VideoCard
              key={review.slug}
              review={review}
              progressPercent={progressBySlug.get(review.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
