import { NextRequest, NextResponse } from "next/server";
import { updateReview, deleteReview, getReview, type ReviewInput } from "@/lib/reviews-store";
import { deleteFile } from "@/lib/r2";
import { notifyNewUpload } from "@/lib/notify";

async function deleteIfReplaced(oldKey: string | undefined, newKey: string | undefined) {
  if (oldKey && oldKey !== newKey) {
    await deleteFile(oldKey).catch(() => {});
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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

  const existing = await getReview(slug);
  const review = await updateReview(slug, body);
  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  await Promise.all([
    deleteIfReplaced(existing?.videoKey, review.videoKey),
    deleteIfReplaced(existing?.thumbnailKey, review.thumbnailKey),
    deleteIfReplaced(existing?.secondReviewerVideoKey, review.secondReviewerVideoKey),
    deleteIfReplaced(existing?.secondReviewerThumbnailKey, review.secondReviewerThumbnailKey),
  ]);

  if (review.status === "published" && existing?.status !== "published") {
    notifyNewUpload({
      origin: req.nextUrl.origin,
      slug: review.slug,
      title: review.title,
    }).catch(() => {});
  }

  return NextResponse.json({ review });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const existing = await getReview(slug);
  if (existing?.videoKey) {
    await deleteFile(existing.videoKey).catch(() => {});
  }
  if (existing?.thumbnailKey) {
    await deleteFile(existing.thumbnailKey).catch(() => {});
  }
  if (existing?.secondReviewerVideoKey) {
    await deleteFile(existing.secondReviewerVideoKey).catch(() => {});
  }
  if (existing?.secondReviewerThumbnailKey) {
    await deleteFile(existing.secondReviewerThumbnailKey).catch(() => {});
  }
  await deleteReview(slug);
  return NextResponse.json({ ok: true });
}
