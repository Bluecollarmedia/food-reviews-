import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Soft-delete: stamp deleted_at on the comment and its replies instead of
  // removing them, so the owner can still see deleted comments (and their
  // images) in the admin panel. Public views filter deleted rows out.
  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .or(`id.eq.${id},parent_id.eq.${id}`)
    .is("deleted_at", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
