import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFile } from "@/lib/r2";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const { data: target } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", id)
    .single();
  if (!target || target.user_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Replies cascade-delete with the parent — collect their attached images
  // too, or they'd be orphaned in R2 with no comment row left to find them.
  const { data: rows } = await supabase
    .from("comments")
    .select("image_key")
    .or(`id.eq.${id},parent_id.eq.${id}`);

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const imageKeys = (rows ?? []).map((r) => r.image_key).filter((k): k is string => !!k);
  await Promise.all(imageKeys.map((k) => deleteFile(k).catch(() => {})));

  return NextResponse.json({ ok: true });
}
