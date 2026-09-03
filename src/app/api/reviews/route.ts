import { NextResponse } from "next/server";
import { listPublishedReviews } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

// Public, read-only: hands back the same published reviews already shown on
// the site's Home/Rankings/Map/Shorts pages, as plain JSON. Nothing here is
// private — it's the same data any visitor already sees rendered on the
// site. Exists so the native app (which can't run Next.js server code, and
// therefore can't read Netlify Blobs directly) has a way to fetch reviews.
export async function GET() {
  const reviews = await listPublishedReviews();
  return NextResponse.json({ reviews });
}
