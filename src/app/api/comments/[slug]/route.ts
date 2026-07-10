import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/comments";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const comments = await getComments(slug);
  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !message) {
    return NextResponse.json(
      { error: "Name and comment are required." },
      { status: 400 }
    );
  }

  const comments = await addComment(slug, name, message);
  return NextResponse.json({ comments });
}
