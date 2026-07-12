import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getUploadUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Must be an image file." }, { status: 400 });
  }

  const key = `avatars/${user.id}-${crypto.randomUUID()}`;
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
