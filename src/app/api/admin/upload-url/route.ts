import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const filename = typeof body?.filename === "string" ? body.filename : "";
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const folder = body?.folder === "thumbnails" ? "thumbnails" : "videos";

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType are required." },
      { status: 400 }
    );
  }

  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const key = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
