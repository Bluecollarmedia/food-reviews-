import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PendingScreen from "@/components/PendingScreen";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → go log in. Already approved → straight to the site.
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("profiles")
    .select("display_name, approval_status")
    .eq("id", user.id)
    .single();
  if ((data?.approval_status ?? "approved") === "approved") redirect("/");

  return <PendingScreen name={data?.display_name ?? ""} />;
}
