import { NextRequest, NextResponse } from "next/server";
import { getReactions, adjustReaction } from "@/lib/reactions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const reactions = await getReactions(slug);
  return NextResponse.json(reactions);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const type = body?.type === "like" || body?.type === "dislike" ? body.type : null;
  const delta = body?.delta === 1 || body?.delta === -1 ? body.delta : null;

  if (!type || !delta) {
    return NextResponse.json({ error: "Invalid type or delta." }, { status: 400 });
  }

  const reactions = await adjustReaction(slug, type, delta);
  return NextResponse.json(reactions);
}
