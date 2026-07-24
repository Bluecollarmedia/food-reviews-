import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "@/lib/r2";
import { listAllReviews } from "@/lib/reviews-store";

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";

  if (!key || (!key.startsWith("videos/") && !key.startsWith("thumbnails/"))) {
    return NextResponse.json({ error: "Invalid file key." }, { status: 400 });
  }

  // Re-check server-side that nothing actually references this file, in case
  // the admin's list was stale (e.g. it was just attached to a review in
  // another tab) — never delete a file that's still in use.
  const reviews = await listAllReviews();
  const inUse = reviews.some(
    (r) =>
      r.videoKey === key ||
      r.thumbnailKey === key ||
      r.secondReviewerVideoKey === key ||
      r.secondReviewerThumbnailKey === key
  );
  if (inUse) {
    return NextResponse.json(
      { error: "This file is now linked to a review — refresh and try again." },
      { status: 409 }
    );
  }

  await deleteFile(key);
  return NextResponse.json({ ok: true });
}
