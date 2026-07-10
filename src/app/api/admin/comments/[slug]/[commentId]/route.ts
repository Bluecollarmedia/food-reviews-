import { NextRequest, NextResponse } from "next/server";
import { deleteComment } from "@/lib/comments";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  const { slug, commentId } = await params;
  const comments = await deleteComment(slug, commentId);
  return NextResponse.json({ comments });
}
