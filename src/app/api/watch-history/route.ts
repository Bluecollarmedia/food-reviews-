import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getReview } from "@/lib/reviews-store";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
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
    await Promise.all((rows ?? []).map((row) => getReview(row.slug)))
  ).filter((r): r is NonNullable<typeof r> => r !== null);

  return NextResponse.json({
    reviews,
    progress: Object.fromEntries(progressBySlug),
  });
}
