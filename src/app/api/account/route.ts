import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  // Same Bearer-token fallback as avatar-upload-url: lets the native app
  // (no shared cookie session) authenticate with its own Supabase token.
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const {
    data: { user },
  } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: "Couldn't delete your account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
