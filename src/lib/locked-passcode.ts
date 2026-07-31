import { createAdminClient } from "./supabase/admin";

export async function getLockedPasscode(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("locked_passcode")
    .eq("id", 1)
    .single();

  return data?.locked_passcode || process.env.LOCKED_PASSCODE || "";
}

export async function getVaultPasscode(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("locked_passcode_2")
    .eq("id", 1)
    .single();

  return data?.locked_passcode_2 || process.env.VAULT_PASSCODE || "";
}
