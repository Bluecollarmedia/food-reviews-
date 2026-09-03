import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyByEmail } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 500) : "";
  const parentId = typeof body?.parentId === "string" ? body.parentId : null;
  const replyToId = typeof body?.replyToId === "string" ? body.replyToId : null;
  const guestName =
    typeof body?.guestName === "string" ? body.guestName.trim().slice(0, 60) : "";
  const imageKey = typeof body?.imageKey === "string" ? body.imageKey : null;

  if (!slug || (!message && !imageKey)) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  // Same Bearer-token fallback as the other routes: lets the native app
  // (no shared cookie session) authenticate with its own Supabase token.
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const {
    data: { user },
  } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();

  if (!user && !guestName) {
    return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  }
  if (!user && parentId) {
    return NextResponse.json({ error: "Log in to reply." }, { status: 401 });
  }

  const { data: inserted, error } = await supabase
    .from("comments")
    .insert({
      slug,
      message,
      parent_id: parentId,
      reply_to_id: replyToId,
      user_id: user?.id ?? null,
      guest_name: user ? null : guestName,
      image_key: imageKey,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "Couldn't post your comment." },
      { status: 500 }
    );
  }

  notifyByEmail({
    origin: req.nextUrl.origin,
    slug,
    parentId,
    message,
    authorId: user?.id ?? null,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
