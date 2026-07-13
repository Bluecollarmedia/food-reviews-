import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Must be an image file." }, { status: 400 });
  }

  const key = `comment-images/${crypto.randomUUID()}`;
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
