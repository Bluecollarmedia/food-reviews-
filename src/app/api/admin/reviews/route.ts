import { NextRequest, NextResponse } from "next/server";
import { createReview, type ReviewInput } from "@/lib/reviews-store";
import { notifyNewUpload } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as ReviewInput | null;

  if (
    !body ||
    !body.title?.trim() ||
    !body.store?.trim() ||
    !body.city ||
    !body.description?.trim() ||
    !body.reviewer ||
    !Array.isArray(body.categories) ||
    body.categories.length === 0 ||
    typeof body.rating !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const review = await createReview(body);

  if (review.status === "published") {
    notifyNewUpload({
      origin: req.nextUrl.origin,
      slug: review.slug,
      title: review.title,
    }).catch(() => {});
  }

  return NextResponse.json({ review });
}
