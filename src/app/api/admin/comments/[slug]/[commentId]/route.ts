import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFile } from "@/lib/r2";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  const supabase = createAdminClient();

  // Replies cascade-delete with the parent — collect their attached images
  // too, or they'd be orphaned in R2 with no comment row left to find them.
  const { data: rows } = await supabase
    .from("comments")
    .select("image_key")
    .or(`id.eq.${commentId},parent_id.eq.${commentId}`);

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const imageKeys = (rows ?? []).map((r) => r.image_key).filter((k): k is string => !!k);
  await Promise.all(imageKeys.map((k) => deleteFile(k).catch(() => {})));

  return NextResponse.json({ ok: true });
}
